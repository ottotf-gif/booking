import { useState, useEffect } from 'react';
import { Calendar, Clock, User, ArrowRight, Check, LogIn, CheckCircle, Scissors, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { GuestBookingFlow, type GuestInfo } from './GuestBookingFlow';
import type { Database } from '../../lib/database.types';

type Service = Database['public']['Tables']['services']['Row'];
type Stylist = Database['public']['Tables']['stylists']['Row'] & {
  profile: Database['public']['Tables']['profiles']['Row'];
};

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BookingViewProps {
  onShowAuth?: () => void;
  onBackToLanding?: () => void;
}

const MIN_LEAD_MINUTES = 30; // Cannot book a time less than 30 minutes from now

export function BookingView({ onShowAuth, onBackToLanding }: BookingViewProps) {
  const { profile, user } = useAuth();
  const [showGuestFlow, setShowGuestFlow] = useState(false);
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [step, setStep] = useState<'service' | 'stylist' | 'datetime' | 'confirm' | 'booked'>('service');
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingStylists, setLoadingStylists] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<{
    service: Service; stylist: Stylist; date: string; time: string;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { loadServices(); }, []);
  useEffect(() => { if (selectedService) loadStylists(); }, [selectedService]);
  useEffect(() => {
    if (selectedStylist && selectedDate) loadAvailableSlots();
  }, [selectedStylist, selectedDate]);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services').select('*').eq('active', true).order('name');
      if (error) throw error;
      setServices(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadStylists = async () => {
    setLoadingStylists(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('stylists')
        .select(`*, profile:profiles(*)`)
        .eq('active', true);
      if (error) throw error;
      setStylists((data as any) || []);
      if (!data || data.length === 0) {
        setError('Inga barbers tillgängliga just nu.');
      }
    } catch (err: any) {
      setError(err.message || 'Kunde inte ladda barbers');
    } finally {
      setLoadingStylists(false);
    }
  };

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const loadAvailableSlots = async () => {
    if (!selectedStylist || !selectedDate || !selectedService) return;
    setLoadingSlots(true);

    try {
      const selectedDateObj = new Date(selectedDate + 'T00:00:00');
      const dayOfWeek = selectedDateObj.getDay();

      // 1) Stylist availability for that weekday (one or more shifts)
      const { data: availabilityRows } = await supabase
        .from('stylist_availability')
        .select('start_time, end_time, is_available')
        .eq('stylist_id', selectedStylist.id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      const workingRanges = (availabilityRows || []).map(r => ({
        start: toMinutes(r.start_time.substring(0, 5)),
        end: toMinutes(r.end_time.substring(0, 5)),
      }));

      // If barber doesn't work this day -> no slots
      if (workingRanges.length === 0) {
        setAvailableSlots([]);
        setLoadingSlots(false);
        return;
      }

      // 2) Time off for that date
      const { data: timeOff } = await supabase
        .from('stylist_time_off')
        .select('start_date, end_date')
        .eq('stylist_id', selectedStylist.id)
        .lte('start_date', selectedDate)
        .gte('end_date', selectedDate);

      if (timeOff && timeOff.length > 0) {
        setAvailableSlots([]);
        setLoadingSlots(false);
        return;
      }

      // 3) Blocked time slots
      const { data: blockedSlots } = await supabase
        .from('blocked_time_slots')
        .select('time_slot, day_of_week, stylist_id')
        .eq('active', true)
        .or(`stylist_id.is.null,stylist_id.eq.${selectedStylist.id}`);

      const blockedTimes = new Set<string>();
      (blockedSlots || []).forEach(block => {
        if (block.day_of_week === null || block.day_of_week === dayOfWeek) {
          blockedTimes.add(block.time_slot.substring(0, 5));
        }
      });

      // 4) Existing appointments
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('stylist_id', selectedStylist.id)
        .eq('appointment_date', selectedDate)
        .neq('status', 'cancelled');

      const bookedRanges = (existingAppointments || []).map(a => ({
        start: toMinutes(a.start_time),
        end: toMinutes(a.end_time),
      }));

      // 5) Min lead-time (today: now + MIN_LEAD_MINUTES rounded up to 15)
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      let minStartMinutes = -Infinity;
      if (selectedDate === todayStr) {
        const m = today.getHours() * 60 + today.getMinutes() + MIN_LEAD_MINUTES;
        minStartMinutes = Math.ceil(m / 15) * 15;
      }

      const overallStart = Math.min(...workingRanges.map(r => r.start));
      const overallEnd = Math.max(...workingRanges.map(r => r.end));

      const slots: TimeSlot[] = [];
      for (let m = overallStart; m < overallEnd; m += 15) {
        const hh = Math.floor(m / 60).toString().padStart(2, '0');
        const mm = (m % 60).toString().padStart(2, '0');
        const time = `${hh}:${mm}`;
        const slotStart = m;
        const slotEnd = m + 15;
        const serviceEnd = m + selectedService.duration_minutes;

        // Must fit entirely inside ONE working range (so lunch gap is excluded)
        const insideRange = workingRanges.some(r => slotStart >= r.start && serviceEnd <= r.end);
        const isBlocked = blockedTimes.has(time);
        const blockTaken = bookedRanges.some(r => slotStart < r.end && slotEnd > r.start);
        const serviceConflict = bookedRanges.some(r => slotStart < r.end && serviceEnd > r.start);
        const tooSoon = slotStart < minStartMinutes;

        slots.push({
          time,
          available: insideRange && !isBlocked && !blockTaken && !serviceConflict && !tooSoon,
        });
      }

      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error loading slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedStylist || !selectedDate || !selectedTime) return;

    const customerId = profile?.id;
    if (!customerId && !guestInfo) {
      setShowGuestFlow(true);
      return;
    }

    setBooking(true);
    setBookingError('');

    try {
      const endTime = new Date(`2000-01-01T${selectedTime}`);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration_minutes);
      const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

      // Re-check for conflicts
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('stylist_id', selectedStylist.id)
        .eq('appointment_date', selectedDate)
        .neq('status', 'cancelled');

      const [sh, sm] = selectedTime.split(':').map(Number);
      const slotStart = sh * 60 + sm;
      const slotEnd = slotStart + selectedService.duration_minutes;
      const hasConflict = (existingAppointments || []).some(a => {
        const [ash, asm] = a.start_time.split(':').map(Number);
        const [aeh, aem] = a.end_time.split(':').map(Number);
        const aStart = ash * 60 + asm;
        const aEnd = aeh * 60 + aem;
        return slotStart < aEnd && slotEnd > aStart;
      });

      if (hasConflict) {
        setBookingError('Den här tiden är inte längre tillgänglig. Välj en annan tid.');
        setStep('datetime');
        loadAvailableSlots();
        setBooking(false);
        return;
      }

      const appointmentData: any = {
        stylist_id: selectedStylist.id,
        service_id: selectedService.id,
        appointment_date: selectedDate,
        start_time: selectedTime,
        end_time: endTimeStr,
        status: 'confirmed',
        total_amount: selectedService.base_price,
        deposit_amount: selectedService.base_price * 0.2,
        payment_status: 'pending',
      };
      if (customerId) {
        appointmentData.customer_id = customerId;
        appointmentData.is_guest_booking = false;
      } else if (guestInfo) {
        appointmentData.customer_id = null;
        appointmentData.is_guest_booking = true;
        appointmentData.guest_name = guestInfo.fullName;
        appointmentData.guest_email = guestInfo.email;
        appointmentData.guest_phone = guestInfo.phone;
      }

      const { error } = await supabase.from('appointments').insert(appointmentData);
      if (error) throw error;

      setConfirmedBooking({
        service: selectedService, stylist: selectedStylist,
        date: selectedDate, time: selectedTime,
      });
      setStep('booked');
      setShowGuestFlow(false);
      setGuestInfo(null);
    } catch (err: any) {
      setBookingError(err.message || 'Kunde inte skapa bokningen');
    } finally {
      setBooking(false);
    }
  };

  const handleGuestInfoSubmit = (info: GuestInfo) => {
    setGuestInfo(info);
    setShowGuestFlow(false);
  };

  // Today is now the minimum date (no longer +1)
  const today = new Date();
  const minDateStr = today.toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 56);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Laddar...</div>
      </div>
    );
  }

  if (showGuestFlow) {
    return (
      <GuestBookingFlow
        onGuestInfoSubmit={handleGuestInfoSubmit}
        onCancel={() => setShowGuestFlow(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="min-w-0">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-2"
            >
              <ChevronLeft className="w-4 h-4" /> Tillbaka till start
            </button>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Boka tid</h1>
          <p className="text-slate-600 text-sm sm:text-base">Välj tjänst, barber och tid</p>
        </div>
        {!user && onShowAuth && (
          <button
            onClick={onShowAuth}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex-shrink-0"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Logga in</span>
          </button>
        )}
      </div>

      {/* Step indicator — mobile-friendly compact version */}
      <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          {[
            { id: 'service', label: 'Tjänst', done: !!selectedService },
            { id: 'stylist', label: 'Barber', done: !!selectedStylist },
            { id: 'datetime', label: 'Tid', done: !!(selectedDate && selectedTime) },
            { id: 'confirm', label: 'Klart', done: false },
          ].map((s, i, arr) => (
            <div key={s.id} className="flex items-center gap-1 sm:gap-2">
              <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium ${
                step === s.id ? 'bg-slate-900 text-white' : s.done ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {s.done && step !== s.id ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="font-medium text-slate-700 hidden sm:inline">{s.label}</span>
              {i < arr.length - 1 && <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 mx-0.5 sm:mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {step === 'service' && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">Välj tjänst</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => { setSelectedService(service); setStep('stylist'); }}
                className="bg-white border-2 border-slate-200 rounded-lg p-4 sm:p-5 text-left hover:border-slate-900 hover:shadow-sm transition-all"
              >
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">{service.name}</h3>
                {service.description && (
                  <p className="text-slate-600 text-sm mb-3 line-clamp-2">{service.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration_minutes} min</span>
                  </div>
                  <div className="text-slate-900 font-semibold">
                    {service.base_price} kr
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'stylist' && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">Välj barber</h2>

          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-800 text-sm">{error}</p>
            </div>
          )}

          {loadingStylists ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <div className="animate-pulse flex flex-col items-center">
                <User className="w-16 h-16 text-slate-400 mb-4" />
                <p className="text-slate-600">Laddar barbers...</p>
              </div>
            </div>
          ) : stylists.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Inga barbers tillgängliga</h3>
              <p className="text-slate-600">Kontakta salongen för hjälp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {stylists.map((stylist) => (
                <button
                  key={stylist.id}
                  onClick={() => { setSelectedStylist(stylist); setStep('datetime'); }}
                  className="bg-white border-2 border-slate-200 rounded-lg p-4 sm:p-5 text-left hover:border-slate-900 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {stylist.profile.avatar_url ? (
                      <img
                        src={stylist.profile.avatar_url}
                        alt={stylist.profile.full_name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                        {stylist.profile.full_name}
                      </h3>
                      {stylist.specializations.length > 0 && (
                        <p className="text-xs sm:text-sm text-slate-600 truncate">
                          {stylist.specializations.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  {stylist.bio && (
                    <p className="text-slate-600 text-sm line-clamp-2">{stylist.bio}</p>
                  )}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setStep('service')}
            className="mt-4 sm:mt-6 flex items-center gap-1 px-2 py-2 text-slate-700 hover:text-slate-900 font-medium text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Tillbaka
          </button>
        </div>
      )}

      {step === 'datetime' && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">Välj datum och tid</h2>

          {bookingError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{bookingError}</p>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Datum</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
              min={minDateStr}
              max={maxDateStr}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-base"
            />
          </div>

          {selectedDate && (
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
              <h3 className="text-sm font-medium text-slate-700 mb-3">Lediga tider</h3>
              {loadingSlots ? (
                <p className="text-slate-600 text-sm py-4 text-center">Laddar lediga tider...</p>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-600 text-sm">
                    Barbern jobbar inte denna dag, eller är ledig.
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Välj ett annat datum.</p>
                </div>
              ) : availableSlots.every(s => !s.available) ? (
                <div className="text-center py-6">
                  <p className="text-slate-600 text-sm">Alla tider är fullbokade denna dag.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => {
                        if (slot.available) { setSelectedTime(slot.time); setStep('confirm'); }
                      }}
                      disabled={!slot.available}
                      className={`px-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        slot.available
                          ? 'bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-900'
                          : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setStep('stylist')}
            className="mt-4 flex items-center gap-1 px-2 py-2 text-slate-700 hover:text-slate-900 font-medium text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Tillbaka
          </button>
        </div>
      )}

      {step === 'confirm' && selectedService && selectedStylist && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">Bekräfta bokning</h2>

          {bookingError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{bookingError}</p>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 mb-4 space-y-3">
            <Row label="Tjänst" value={selectedService.name} />
            <Row label="Barber" value={selectedStylist.profile.full_name} />
            <Row
              label="Datum & tid"
              value={`${new Date(selectedDate + 'T00:00:00').toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })} kl. ${selectedTime}`}
            />
            <Row label="Längd" value={`${selectedService.duration_minutes} minuter`} />
            <div className="pt-3 border-t border-slate-200">
              <span className="text-sm text-slate-600">Totalt</span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">{selectedService.base_price} kr</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('datetime')}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Tillbaka
            </button>
            <button
              onClick={handleBooking}
              disabled={booking}
              className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 font-medium"
            >
              {booking ? 'Bokar...' : !user && !guestInfo ? 'Fortsätt' : 'Bekräfta'}
            </button>
          </div>
        </div>
      )}

      {step === 'booked' && confirmedBooking && (
        <div className="max-w-lg mx-auto text-center py-6 sm:py-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Bokningen är bekräftad!</h2>
          <p className="text-slate-600 mb-8 text-sm sm:text-base">Vi ses snart.</p>

          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 text-left mb-6 space-y-3">
            <IconRow icon={Scissors} label="Tjänst" value={confirmedBooking.service.name} />
            <IconRow icon={User} label="Barber" value={confirmedBooking.stylist.profile.full_name} />
            <IconRow
              icon={Calendar}
              label="Datum & tid"
              value={`${new Date(confirmedBooking.date + 'T00:00:00').toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })} kl. ${confirmedBooking.time}`}
            />
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">Totalt</p>
              <p className="text-lg font-bold text-slate-900">{confirmedBooking.service.base_price} kr</p>
            </div>
          </div>

          <button
            onClick={() => {
              setStep('service'); setSelectedService(null); setSelectedStylist(null);
              setSelectedDate(''); setSelectedTime(''); setConfirmedBooking(null);
            }}
            className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            Boka en till
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs sm:text-sm text-slate-600">{label}</span>
      <p className="text-base sm:text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function IconRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-slate-700" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}