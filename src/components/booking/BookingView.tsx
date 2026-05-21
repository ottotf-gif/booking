import { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, User, ArrowRight, Check, LogIn, CheckCircle, Scissors } from 'lucide-react';
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
}

export function BookingView({ onShowAuth }: BookingViewProps) {
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
  const [loading, setLoading] = useState(true);
  const [loadingStylists, setLoadingStylists] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<{
    service: Service;
    stylist: Stylist;
    date: string;
    time: string;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      loadStylists();
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedStylist && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedStylist, selectedDate]);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStylists = async () => {
    setLoadingStylists(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('stylists')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('active', true);

      if (error) throw error;

      console.log('Loaded stylists:', data);
      setStylists((data as any) || []);

      if (!data || data.length === 0) {
        setError('No barbers available at this time. Please contact the admin.');
      }
    } catch (error: any) {
      console.error('Error loading stylists:', error);
      setError(error.message || 'Failed to load barbers');
    } finally {
      setLoadingStylists(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedStylist || !selectedDate || !selectedService) return;

    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 18;

    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = selectedDateObj.getDay();

    const { data: blockedSlots } = await supabase
      .from('blocked_time_slots')
      .select('time_slot, day_of_week, stylist_id')
      .eq('active', true)
      .or(`stylist_id.is.null,stylist_id.eq.${selectedStylist.id}`);

    const blockedTimes = new Set<string>();
    if (blockedSlots) {
      blockedSlots.forEach(block => {
        if ((block.day_of_week === null || block.day_of_week === dayOfWeek)) {
          blockedTimes.add(block.time_slot.substring(0, 5));
        }
      });
    }

    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('stylist_id', selectedStylist.id)
      .eq('appointment_date', selectedDate)
      .neq('status', 'cancelled');

    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const bookedRanges = (existingAppointments || []).map(appt => ({
      start: toMinutes(appt.start_time),
      end: toMinutes(appt.end_time),
    }));

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isBlocked = blockedTimes.has(time);

        const slotStart = hour * 60 + minute;
        const blockEnd = slotStart + 15;
        const serviceEnd = slotStart + selectedService.duration_minutes;

        const blockTaken = bookedRanges.some(r => slotStart < r.end && blockEnd > r.start);
        const serviceConflict = bookedRanges.some(r => slotStart < r.end && serviceEnd > r.start);

        slots.push({
          time,
          available: !isBlocked && !blockTaken && !serviceConflict,
        });
      }
    }

    setAvailableSlots(slots);
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedStylist || !selectedDate || !selectedTime) {
      return;
    }

    // Check if user is authenticated or has guest info
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

      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('stylist_id', selectedStylist.id)
        .eq('appointment_date', selectedDate)
        .neq('status', 'cancelled');

      if (existingAppointments && existingAppointments.length > 0) {
        const [slotStartHour, slotStartMin] = selectedTime.split(':').map(Number);
        const slotStart = slotStartHour * 60 + slotStartMin;
        const slotEnd = slotStart + selectedService.duration_minutes;

        const hasConflict = existingAppointments.some(appt => {
          const [apptStartHour, apptStartMin] = appt.start_time.split(':').map(Number);
          const [apptEndHour, apptEndMin] = appt.end_time.split(':').map(Number);
          const apptStart = apptStartHour * 60 + apptStartMin;
          const apptEnd = apptEndHour * 60 + apptEndMin;
          return slotStart < apptEnd && slotEnd > apptStart;
        });

        if (hasConflict) {
          setBookingError('This time slot is no longer available. Please select another time.');
          setStep('datetime');
          loadAvailableSlots();
          setBooking(false);
          return;
        }
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

      const { error } = await supabase
        .from('appointments')
        .insert(appointmentData);

      if (error) throw error;

      setConfirmedBooking({
        service: selectedService,
        stylist: selectedStylist,
        date: selectedDate,
        time: selectedTime,
      });
      setStep('booked');
      setShowGuestFlow(false);
      setGuestInfo(null);
    } catch (err: any) {
      console.error('Error booking appointment:', err);
      setBookingError(err.message || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  const handleGuestInfoSubmit = (info: GuestInfo) => {
    // Store guest information but DO NOT create a user account
    // This ensures guest emails are NOT stored as permanent users
    setGuestInfo(info);
    setShowGuestFlow(false);
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 56);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading...</div>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Book an Appointment</h1>
          <p className="text-slate-600">Choose your service, barber, and preferred time</p>
        </div>
        {!user && onShowAuth && (
          <button
            onClick={onShowAuth}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        )}
      </div>

      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'service' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
            {selectedService ? <Check className="w-5 h-5" /> : '1'}
          </div>
          <span className="text-sm font-medium text-slate-700">Service</span>
          <ArrowRight className="w-4 h-4 text-slate-400 mx-2" />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'stylist' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
            {selectedStylist ? <Check className="w-5 h-5" /> : '2'}
          </div>
          <span className="text-sm font-medium text-slate-700">Barber</span>
          <ArrowRight className="w-4 h-4 text-slate-400 mx-2" />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'datetime' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
            {selectedDate && selectedTime ? <Check className="w-5 h-5" /> : '3'}
          </div>
          <span className="text-sm font-medium text-slate-700">Date & Time</span>
          <ArrowRight className="w-4 h-4 text-slate-400 mx-2" />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'confirm' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
            4
          </div>
          <span className="text-sm font-medium text-slate-700">Confirm</span>
        </div>
      </div>

      {step === 'service' && (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Select a Service</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedService(service);
                  setStep('stylist');
                }}
                className="bg-white border-2 border-slate-200 rounded-lg p-6 text-left hover:border-slate-900 transition-colors"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{service.name}</h3>
                {service.description && (
                  <p className="text-slate-600 text-sm mb-4">{service.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-900 font-semibold">
                    <DollarSign className="w-4 h-4" />
                    <span>{service.base_price}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'stylist' && (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Select a Barber</h2>

          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-800 text-sm">
                <strong>Notice:</strong> {error}
              </p>
              <p className="text-amber-700 text-sm mt-2">
                The admin needs to add barbers through the Staff Management section before customers can book appointments.
              </p>
            </div>
          )}

          {loadingStylists ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <div className="animate-pulse flex flex-col items-center">
                <User className="w-16 h-16 text-slate-400 mb-4" />
                <p className="text-slate-600">Loading barbers...</p>
              </div>
            </div>
          ) : stylists.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Barbers Available</h3>
              <p className="text-slate-600 mb-4">
                There are currently no barbers available to take appointments.
              </p>
              <p className="text-sm text-slate-500">
                Please contact the admin or check back later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stylists.map((stylist) => (
                <button
                  key={stylist.id}
                  onClick={() => {
                    setSelectedStylist(stylist);
                    setStep('datetime');
                  }}
                  className="bg-white border-2 border-slate-200 rounded-lg p-6 text-left hover:border-slate-900 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">{stylist.profile.full_name}</h3>
                      {stylist.specializations.length > 0 && (
                        <p className="text-sm text-slate-600">{stylist.specializations.join(', ')}</p>
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
            className="mt-6 px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            ← Back to Services
          </button>
        </div>
      )}

      {step === 'datetime' && (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Select Date & Time</h2>

          {bookingError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{bookingError}</p>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={minDateStr}
              max={maxDateStr}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          {selectedDate && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-medium text-slate-700 mb-4">Available Time Slots</h3>
              {availableSlots.length === 0 ? (
                <p className="text-slate-600">Loading available slots...</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => {
                        if (slot.available) {
                          setSelectedTime(slot.time);
                          setStep('confirm');
                        }
                      }}
                      disabled={!slot.available}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        slot.available
                          ? 'bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-900'
                          : 'bg-slate-50 text-slate-400 cursor-not-allowed'
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
            className="mt-4 px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            ← Back to Barbers
          </button>
        </div>
      )}

      {step === 'booked' && confirmedBooking && (
        <div className="max-w-lg mx-auto text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
          <p className="text-slate-600 mb-8">Your appointment has been booked. See you soon!</p>

          <div className="bg-white rounded-xl border border-slate-200 p-6 text-left mb-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Scissors className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Service</p>
                <p className="font-semibold text-slate-900">{confirmedBooking.service.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Barber</p>
                <p className="font-semibold text-slate-900">{confirmedBooking.stylist.profile.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Date & Time</p>
                <p className="font-semibold text-slate-900">
                  {new Date(confirmedBooking.date + 'T00:00:00').toLocaleDateString('en-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {confirmedBooking.time}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Duration</p>
                <p className="font-semibold text-slate-900">{confirmedBooking.service.duration_minutes} min</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-lg font-bold text-slate-900">{confirmedBooking.service.base_price} kr</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setStep('service');
              setSelectedService(null);
              setSelectedStylist(null);
              setSelectedDate('');
              setSelectedTime('');
              setConfirmedBooking(null);
            }}
            className="px-8 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            Book Another Appointment
          </button>
        </div>
      )}

      {step === 'confirm' && selectedService && selectedStylist && (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Confirm Your Booking</h2>

          {bookingError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{bookingError}</p>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <div className="space-y-4">
              <div>
                <span className="text-sm text-slate-600">Service</span>
                <p className="text-lg font-semibold text-slate-900">{selectedService.name}</p>
              </div>
              <div>
                <span className="text-sm text-slate-600">Barber</span>
                <p className="text-lg font-semibold text-slate-900">{selectedStylist.profile.full_name}</p>
              </div>
              <div>
                <span className="text-sm text-slate-600">Date & Time</span>
                <p className="text-lg font-semibold text-slate-900">
                  {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
                </p>
              </div>
              <div>
                <span className="text-sm text-slate-600">Duration</span>
                <p className="text-lg font-semibold text-slate-900">{selectedService.duration_minutes} minutes</p>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <span className="text-sm text-slate-600">Total Price</span>
                <p className="text-2xl font-bold text-slate-900">${selectedService.base_price}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('datetime')}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleBooking}
              disabled={booking}
              className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {booking ? 'Booking...' : !user && !guestInfo ? 'Continue' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
