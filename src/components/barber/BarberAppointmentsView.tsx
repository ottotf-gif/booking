import { useState, useEffect } from 'react';
import { Calendar, Clock, User, DollarSign, CheckCircle, XCircle, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  service: Database['public']['Tables']['services']['Row'] | null;
  customer: Database['public']['Tables']['profiles']['Row'] | null;
};

type StatusFilter = 'upcoming' | 'completed' | 'all';

export function BarberAppointmentsView() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('upcoming');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAppointments();
      loadUpcomingCount();
    }
  }, [user, filter]);

  const loadUpcomingCount = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('stylist_id', user.id)
      .gte('appointment_date', today)
      .neq('status', 'cancelled')
      .neq('status', 'completed');
    setUpcomingCount(count ?? 0);
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('appointments')
        .select(`
          *,
          service:services(*),
          customer:profiles(*)
        `)
        .eq('stylist_id', user?.id)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      // Apply filter based on status
      const today = new Date().toISOString().split('T')[0];

      if (filter === 'upcoming') {
        query = query
          .gte('appointment_date', today)
          .neq('status', 'cancelled')
          .neq('status', 'completed');
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed');
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments((data as any) || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark appointment as completed AND paid in a single atomic operation
  // This ensures both status updates succeed or both fail together
  const handleMarkCompletedAndPaid = async (appointmentId: string, isCompleted: boolean, isPaid: boolean) => {
    setUpdatingId(appointmentId);
    try {
      // Check if already both completed and paid
      const isFullyProcessed = isCompleted && isPaid;

      if (isFullyProcessed) {
        // Revert both: set status back to confirmed and payment_status back to pending
        const { error } = await supabase
          .from('appointments')
          .update({
            status: 'confirmed',
            payment_status: 'pending'
          })
          .eq('id', appointmentId);

        if (error) throw error;
      } else {
        // Mark as completed AND paid in single atomic operation
        const { error } = await supabase
          .from('appointments')
          .update({
            status: 'completed',
            payment_status: 'paid'
          })
          .eq('id', appointmentId);

        if (error) throw error;
      }

      await loadAppointments();
      loadUpcomingCount();
    } catch (error: any) {
      alert(error.message || 'Misslyckades att uppdatera bokning');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      no_show: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getPaymentBadge = (status: string) => {
    const styles = {
      pending: 'bg-orange-100 text-orange-800 border-orange-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      refunded: 'bg-purple-100 text-purple-800 border-purple-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('sv-SE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Laddar dina bokningar...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Mina Bokningar</h1>
        <p className="text-slate-600 mt-1">Hantera dina kundmöten och betalningar</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Visa:</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Kommande ({upcomingCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Utförda
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Alla
          </button>
        </div>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Inga bokningar
          </h3>
          <p className="text-slate-600">
            {filter === 'upcoming' && 'Du har inga kommande bokningar.'}
            {filter === 'completed' && 'Du har inga utförda bokningar.'}
            {filter === 'all' && 'Du har inga bokningar ännu.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Appointment Info */}
                <div className="flex-1 space-y-3">
                  {/* Date and Time */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                      <Calendar className="w-4 h-4 text-slate-600" />
                      {formatDate(appointment.appointment_date)}
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-4 h-4 text-slate-600" />
                      {appointment.start_time} - {appointment.end_time}
                    </div>
                  </div>

                  {/* Customer and Service */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-600" />
                      <div>
                        <span className="text-sm text-slate-600">Kund:</span>
                        <p className="font-medium text-slate-900 flex items-center gap-2">
                          {appointment.is_guest_booking
                            ? appointment.guest_name || 'Gäst'
                            : appointment.customer?.full_name || 'Okänd'}
                          {appointment.is_guest_booking && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              Gäst
                            </span>
                          )}
                        </p>
                        {appointment.is_guest_booking && (appointment.guest_phone || appointment.guest_email) && (
                          <p className="text-xs text-slate-500">
                            {appointment.guest_phone}
                            {appointment.guest_phone && appointment.guest_email && ' · '}
                            {appointment.guest_email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-slate-600">Tjänst:</span>
                      <p className="font-medium text-slate-900">
                        {appointment.service?.name || 'Borttagen tjänst'}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-600" />
                    <span className="text-lg font-semibold text-slate-900">
                      {Number(appointment.total_amount).toFixed(2)} kr
                    </span>
                  </div>

                  {/* Status Badges */}
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(
                        appointment.status
                      )}`}
                    >
                      {appointment.status === 'pending' && 'Väntande'}
                      {appointment.status === 'confirmed' && 'Bekräftad'}
                      {appointment.status === 'completed' && 'Utförd'}
                      {appointment.status === 'cancelled' && 'Inställd'}
                      {appointment.status === 'no_show' && 'Utebliven'}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full border ${getPaymentBadge(
                        appointment.payment_status
                      )}`}
                    >
                      {appointment.payment_status === 'pending' && 'Obetald'}
                      {appointment.payment_status === 'paid' && 'Betald'}
                      {appointment.payment_status === 'refunded' && 'Återbetald'}
                      {appointment.payment_status === 'failed' && 'Misslyckad'}
                    </span>
                  </div>

                  {/* Special Requests */}
                  {appointment.special_requests && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-sm text-slate-600">
                        <strong>Önskemål:</strong> {appointment.special_requests}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="flex flex-col gap-2 lg:w-48">
                  {/* Combined Button: Mark as Completed & Paid */}
                  <button
                    onClick={() =>
                      handleMarkCompletedAndPaid(
                        appointment.id,
                        appointment.status === 'completed',
                        appointment.payment_status === 'paid'
                      )
                    }
                    disabled={updatingId === appointment.id || appointment.status === 'cancelled'}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      appointment.status === 'completed' && appointment.payment_status === 'paid'
                        ? 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                        : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 shadow-md'
                    }`}
                  >
                    {appointment.status === 'completed' && appointment.payment_status === 'paid' ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        Ångra
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Utförd & Betald
                      </>
                    )}
                  </button>

                  {/* Info text explaining the action */}
                  {!(appointment.status === 'completed' && appointment.payment_status === 'paid') && (
                    <p className="text-xs text-slate-500 text-center">
                      Markerar tjänsten som utförd och betald samtidigt
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
