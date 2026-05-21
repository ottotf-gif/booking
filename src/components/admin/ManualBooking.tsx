import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Users, Check, Phone, UserPlus, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { GuestInfoModal } from './GuestInfoModal';
import type { Database } from '../../lib/database.types';

type Service = Database['public']['Tables']['services']['Row'];
type Stylist = Database['public']['Tables']['stylists']['Row'] & {
  profile: Database['public']['Tables']['profiles']['Row'];
};

interface GuestInfo {
  fullName: string;
  email: string;
  phone: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  bookedCount: number;
  totalStylists: number;
}

interface AvailableStylist {
  stylist: Stylist;
  isAvailable: boolean;
}

export function ManualBooking() {
  const [step, setStep] = useState<'date' | 'time' | 'barber' | 'guest' | 'service' | 'confirm' | 'success'>('date');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availableStylists, setAvailableStylists] = useState<AvailableStylist[]>([]);
  const [allStylists, setAllStylists] = useState<Stylist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [showGuestInfoModal, setShowGuestInfoModal] = useState(false);

  const minDate = new Date();
  const minDateStr = minDate.toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 56);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  useEffect(() => {
    loadStylists();
    loadServices();
  }, []);

  useEffect(() => {
    if (selectedDate && allStylists.length > 0) {
      loadTimeSlots();
    }
  }, [selectedDate, allStylists]);

  useEffect(() => {
    if (selectedTime && selectedDate && selectedService) {
      loadAvailableStylists();
    }
  }, [selectedTime, selectedDate, selectedService]);

  const loadStylists = async () => {
    try {
      const { data, error } = await supabase
        .from('stylists')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('active', true);

      if (error) throw error;
      setAllStylists((data as any) || []);
    } catch (error) {
      console.error('Error loading stylists:', error);
    }
  };

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
    }
  };

  const loadTimeSlots = async () => {
    if (!selectedDate) return;

    setLoading(true);
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 18;

    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = selectedDateObj.getDay();

    const { data: blockedSlots } = await supabase
      .from('blocked_time_slots')
      .select('time_slot, day_of_week, stylist_id')
      .eq('active', true);

    const blockedTimes = new Set<string>();
    if (blockedSlots) {
      blockedSlots.forEach(block => {
        if ((block.day_of_week === null || block.day_of_week === dayOfWeek) && block.stylist_id === null) {
          blockedTimes.add(block.time_slot.substring(0, 5));
        }
      });
    }

    const { data: appointments } = await supabase
      .from('appointments')
      .select('stylist_id, start_time, end_time')
      .eq('appointment_date', selectedDate)
      .neq('status', 'cancelled');

    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const bookedRanges = (appointments || []).map(a => ({
      stylistId: a.stylist_id,
      start: toMinutes(a.start_time),
      end: toMinutes(a.end_time),
    }));

    const totalStylists = allStylists.length;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        if (blockedTimes.has(time)) {
          slots.push({
            time,
            available: false,
            bookedCount: totalStylists,
            totalStylists,
          });
          continue;
        }

        const slotStart = hour * 60 + minute;
        const blockEnd = slotStart + 15;

        const busyStylists = new Set(
          bookedRanges
            .filter(r => slotStart < r.end && blockEnd > r.start)
            .map(r => r.stylistId)
        );
        const bookedCount = busyStylists.size;

        slots.push({
          time,
          available: bookedCount < totalStylists,
          bookedCount,
          totalStylists,
        });
      }
    }

    setTimeSlots(slots);
    setLoading(false);
  };

  const loadAvailableStylists = async () => {
    if (!selectedTime || !selectedDate || !selectedService) return;

    setLoading(true);
    const availabilityList: AvailableStylist[] = [];

    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = selectedDateObj.getDay();

    const { data: blockedSlots } = await supabase
      .from('blocked_time_slots')
      .select('time_slot, day_of_week, stylist_id')
      .eq('active', true);

    for (const stylist of allStylists) {
      let isBlocked = false;

      if (blockedSlots) {
        isBlocked = blockedSlots.some(block => {
          if ((block.day_of_week === null || block.day_of_week === dayOfWeek)) {
            if (block.stylist_id === stylist.id || block.stylist_id === null) {
              const timeStr = block.time_slot.substring(0, 5);
              return timeStr === selectedTime;
            }
          }
          return false;
        });
      }

      if (isBlocked) {
        availabilityList.push({ stylist, isAvailable: false });
        continue;
      }

      const endTime = new Date(`2000-01-01T${selectedTime}`);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration_minutes);
      const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('stylist_id', stylist.id)
        .eq('appointment_date', selectedDate)
        .neq('status', 'cancelled');

      let hasConflict = false;
      if (existingAppointments && existingAppointments.length > 0) {
        const [slotStartHour, slotStartMin] = selectedTime.split(':').map(Number);
        const [slotEndHour, slotEndMin] = endTimeStr.split(':').map(Number);
        const slotStart = slotStartHour * 60 + slotStartMin;
        const slotEnd = slotEndHour * 60 + slotEndMin;

        hasConflict = existingAppointments.some(appt => {
          const [apptStartHour, apptStartMin] = appt.start_time.split(':').map(Number);
          const [apptEndHour, apptEndMin] = appt.end_time.split(':').map(Number);
          const apptStart = apptStartHour * 60 + apptStartMin;
          const apptEnd = apptEndHour * 60 + apptEndMin;

          return (slotStart < apptEnd && slotEnd > apptStart);
        });
      }

      availabilityList.push({ stylist, isAvailable: !hasConflict });
    }

    setAvailableStylists(availabilityList);
    setLoading(false);
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedStylist || !selectedDate || !selectedTime || !guestInfo) {
      return;
    }

    setBooking(true);
    setError('');

    try {
      const endTime = new Date(`2000-01-01T${selectedTime}`);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration_minutes);
      const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          customer_id: null,
          is_guest_booking: true,
          guest_name: guestInfo.fullName,
          guest_email: guestInfo.email,
          guest_phone: guestInfo.phone,
          stylist_id: selectedStylist.id,
          service_id: selectedService.id,
          appointment_date: selectedDate,
          start_time: selectedTime,
          end_time: endTimeStr,
          status: 'confirmed',
          total_amount: selectedService.base_price,
          deposit_amount: selectedService.base_price * 0.2,
          payment_status: 'pending',
        });

      if (insertError) throw insertError;

      setStep('success');
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      setError(error.message || 'Failed to create appointment');
    } finally {
      setBooking(false);
    }
  };

  return (
    <>
      {showGuestInfoModal && (
        <GuestInfoModal
          onGuestInfoProvided={(info) => {
            setGuestInfo(info);
            setShowGuestInfoModal(false);
            setStep('confirm');
          }}
          onClose={() => setShowGuestInfoModal(false)}
        />
      )}
      <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Manual Booking</h1>
        <p className="text-slate-600">Create appointments for phone-in customers</p>
      </div>

      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'date' ? 'bg-slate-900 text-white' : selectedDate ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            {selectedDate ? <Check className="w-5 h-5" /> : '1'}
          </div>
          <span className="text-sm font-medium text-slate-700">Date</span>
          <span className="text-slate-400 mx-1">→</span>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'time' ? 'bg-slate-900 text-white' : selectedTime ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            {selectedTime ? <Check className="w-5 h-5" /> : '2'}
          </div>
          <span className="text-sm font-medium text-slate-700">Time</span>
          <span className="text-slate-400 mx-1">→</span>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'service' ? 'bg-slate-900 text-white' : selectedService ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            {selectedService ? <Check className="w-5 h-5" /> : '3'}
          </div>
          <span className="text-sm font-medium text-slate-700">Service</span>
          <span className="text-slate-400 mx-1">→</span>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'barber' ? 'bg-slate-900 text-white' : selectedStylist ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            {selectedStylist ? <Check className="w-5 h-5" /> : '4'}
          </div>
          <span className="text-sm font-medium text-slate-700">Barber</span>
          <span className="text-slate-400 mx-1">→</span>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'guest' ? 'bg-slate-900 text-white' : guestInfo ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            {guestInfo ? <Check className="w-5 h-5" /> : '5'}
          </div>
          <span className="text-sm font-medium text-slate-700">Guest Info</span>
          <span className="text-slate-400 mx-1">→</span>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'confirm' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
            6
          </div>
          <span className="text-sm font-medium text-slate-700">Confirm</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {step === 'date' && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Select Date
          </h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedTime('');
              setSelectedStylist(null);
              setSelectedService(null);
            }}
            min={minDateStr}
            max={maxDateStr}
            className="w-full max-w-md px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-lg"
          />
          {selectedDate && (
            <button
              onClick={() => setStep('time')}
              className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Continue to Time Selection
            </button>
          )}
        </div>
      )}

      {step === 'time' && selectedDate && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Select Time Slot
            </h2>
            <div className="text-sm text-slate-600">
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="mb-6 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-100 border border-amber-300 rounded"></div>
              <span>Partially Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-100 border border-slate-300 rounded"></div>
              <span>Fully Booked</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-slate-600">Loading time slots...</div>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => {
                    if (slot.available) {
                      setSelectedTime(slot.time);
                      setStep('service');
                    }
                  }}
                  disabled={!slot.available}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all relative ${
                    slot.available
                      ? slot.bookedCount === 0
                        ? 'bg-green-100 border-2 border-green-300 hover:bg-green-200 hover:border-green-400 text-green-900'
                        : 'bg-amber-100 border-2 border-amber-300 hover:bg-amber-200 hover:border-amber-400 text-amber-900'
                      : 'bg-slate-100 border-2 border-slate-300 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <div className="font-semibold">{slot.time}</div>
                  <div className="text-xs mt-1">
                    {slot.available ? (
                      <>
                        {slot.totalStylists - slot.bookedCount}/{slot.totalStylists}
                      </>
                    ) : (
                      'Blocked'
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setStep('date')}
            className="mt-6 px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            ← Back to Date
          </button>
        </div>
      )}

      {step === 'service' && selectedTime && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Select Service</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedService(service);
                  setStep('barber');
                }}
                className="bg-white border-2 border-slate-200 rounded-lg p-4 text-left hover:border-slate-900 transition-colors"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{service.name}</h3>
                {service.description && (
                  <p className="text-slate-600 text-sm mb-3">{service.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration_minutes} min</span>
                  </div>
                  <div className="text-slate-900 font-semibold">${service.base_price}</div>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep('time')}
            className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            ← Back to Time
          </button>
        </div>
      )}

      {step === 'barber' && selectedTime && selectedService && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select Barber
          </h2>
          <div className="mb-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              <strong>Selected Time:</strong> {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              <strong>Service:</strong> {selectedService.name} ({selectedService.duration_minutes} min)
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-slate-600">Checking barber availability...</div>
            </div>
          ) : availableStylists.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
              <Users className="w-12 h-12 text-amber-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-amber-900 mb-2">No Barbers Available</h3>
              <p className="text-amber-700">There are no barbers available at this time. Please select a different time slot.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableStylists.map(({ stylist, isAvailable }) => (
                <button
                  key={stylist.id}
                  onClick={() => {
                    if (isAvailable) {
                      setSelectedStylist(stylist);
                      setStep('guest');
                    }
                  }}
                  disabled={!isAvailable}
                  className={`border-2 rounded-lg p-4 text-left transition-all ${
                    isAvailable
                      ? 'border-slate-200 hover:border-slate-900 hover:shadow-md cursor-pointer'
                      : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isAvailable ? 'bg-slate-900' : 'bg-slate-400'}`}>
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">{stylist.profile.full_name}</h3>
                      {stylist.specializations.length > 0 && (
                        <p className="text-sm text-slate-600">{stylist.specializations.join(', ')}</p>
                      )}
                      <p className={`text-xs font-medium mt-1 ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {isAvailable ? '✓ Available' : '✗ Unavailable'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setStep('service')}
            className="mt-6 px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            ← Back to Service
          </button>
        </div>
      )}

      {step === 'guest' && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Guest Information
          </h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              This is a guest booking for a walk-in or phone-in customer. Click the button below to enter the guest's contact information. No customer account will be created.
            </p>
          </div>

          {guestInfo ? (
            <div className="bg-white border-2 border-green-300 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{guestInfo.fullName}</h3>
                  <p className="text-sm text-slate-600">{guestInfo.email}</p>
                  <p className="text-sm text-slate-600">{guestInfo.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuestInfoModal(true)}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Edit guest information
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowGuestInfoModal(true)}
              className="w-full px-6 py-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Enter Guest Information
            </button>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep('barber')}
              className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
            >
              ← Back to Barber
            </button>
            {guestInfo && (
              <button
                onClick={() => setStep('confirm')}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors ml-auto"
              >
                Continue to Confirmation
              </button>
            )}
          </div>
        </div>
      )}

      {step === 'confirm' && guestInfo && selectedStylist && selectedService && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Confirm Guest Booking</h2>

          <div className="space-y-4 mb-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-blue-800 block mb-1">Guest Information</span>
              <p className="text-lg font-semibold text-slate-900">{guestInfo.fullName}</p>
              <p className="text-sm text-slate-600">{guestInfo.email}</p>
              <p className="text-sm text-slate-600">{guestInfo.phone}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600 block mb-1">Service</span>
              <p className="text-lg font-semibold text-slate-900">{selectedService.name}</p>
              <p className="text-sm text-slate-600">{selectedService.duration_minutes} minutes</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600 block mb-1">Barber</span>
              <p className="text-lg font-semibold text-slate-900">{selectedStylist.profile.full_name}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600 block mb-1">Date & Time</span>
              <p className="text-lg font-semibold text-slate-900">
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-lg font-semibold text-slate-900">{selectedTime}</p>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-lg">
              <span className="text-sm opacity-80 block mb-1">Total Price</span>
              <p className="text-2xl font-bold">${selectedService.base_price}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('guest')}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleBooking}
              disabled={booking}
              className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {booking ? 'Creating Appointment...' : 'Create Guest Appointment'}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && selectedStylist && selectedService && (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Created!</h2>
          <p className="text-slate-600 mb-6">The guest appointment has been successfully created.</p>

          <div className="bg-slate-50 rounded-lg p-4 text-left space-y-2 mb-8">
            <p className="text-sm"><span className="text-slate-500">Guest:</span> <span className="font-medium text-slate-900">{guestInfo?.fullName}</span></p>
            <p className="text-sm"><span className="text-slate-500">Service:</span> <span className="font-medium text-slate-900">{selectedService.name}</span></p>
            <p className="text-sm"><span className="text-slate-500">Barber:</span> <span className="font-medium text-slate-900">{selectedStylist.profile.full_name}</span></p>
            <p className="text-sm"><span className="text-slate-500">Date & Time:</span> <span className="font-medium text-slate-900">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at {selectedTime}</span></p>
          </div>

          <button
            onClick={() => {
              setStep('date');
              setSelectedDate('');
              setSelectedTime('');
              setSelectedStylist(null);
              setGuestInfo(null);
              setSelectedService(null);
              setTimeSlots([]);
            }}
            className="px-8 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            Book Another Appointment
          </button>
        </div>
      )}
      </div>
    </>
  );
}
