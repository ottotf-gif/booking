import { useState, useEffect } from 'react';
import { Calendar, Clock, User, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  service: Database['public']['Tables']['services']['Row'] | null;
  stylist: (Database['public']['Tables']['stylists']['Row'] & {
    profile: Database['public']['Tables']['profiles']['Row'];
  }) | null;
  customer: Database['public']['Tables']['profiles']['Row'] | null;
};

export function AppointmentsView() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  useEffect(() => {
    loadAppointments();
  }, [profile, filter]);

  const loadAppointments = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          service:services(*),
          stylist:stylists(*, profile:profiles(*)),
          customer:profiles(*)
        `);

      if (profile.role === 'customer') {
        query = query.eq('customer_id', profile.id);
      } else if (profile.role === 'stylist') {
        query = query.eq('stylist_id', profile.id);
      }
      // Admin sees all appointments - no filter needed

      const today = new Date().toISOString().split('T')[0];

      if (filter === 'upcoming') {
        query = query
          .gte('appointment_date', today)
          .neq('status', 'cancelled')
          .order('appointment_date', { ascending: true })
          .order('start_time', { ascending: true });
      } else if (filter === 'past') {
        query = query
          .lt('appointment_date', today)
          .order('appointment_date', { ascending: false })
          .order('start_time', { ascending: false });
      } else {
        query = query
          .order('appointment_date', { ascending: false })
          .order('start_time', { ascending: false });
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

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      loadAppointments();
    } catch (error: any) {
      alert(error.message || 'Failed to cancel appointment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading appointments...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-slate-600 mt-1">View and manage your appointments</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'upcoming'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'past'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Past
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No appointments found</h3>
          <p className="text-slate-600">
            {filter === 'upcoming'
              ? "You don't have any upcoming appointments"
              : filter === 'past'
              ? "You don't have any past appointments"
              : "You don't have any appointments"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {appointment.service?.name || 'Service Deleted'}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>{appointment.start_time} - {appointment.end_time}</span>
                    </div>

                    {profile?.role === 'customer' && appointment.stylist && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-4 h-4" />
                        <span>{appointment.stylist.profile.full_name}</span>
                      </div>
                    )}

                    {(profile?.role === 'stylist' || profile?.role === 'admin') && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-4 h-4" />
                        <span>
                          {appointment.is_guest_booking
                            ? `${appointment.guest_name || 'Guest'} (Guest)`
                            : appointment.customer?.full_name || 'Unknown'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-900 font-medium">
                      <DollarSign className="w-4 h-4" />
                      <span>${appointment.total_amount}</span>
                    </div>
                  </div>

                  {appointment.special_requests && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">
                        <strong>Special requests:</strong> {appointment.special_requests}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  {profile?.role === 'customer' && (
                    <button
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Cancel Appointment
                    </button>
                  )}
                  {profile?.role === 'stylist' && (
                    <button
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Cancel Appointment
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
