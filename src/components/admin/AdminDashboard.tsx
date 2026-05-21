import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Users, Scissors, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  service: Database['public']['Tables']['services']['Row'] | null;
  stylist: (Database['public']['Tables']['stylists']['Row'] & {
    profile: Database['public']['Tables']['profiles']['Row'];
  }) | null;
  customer: Database['public']['Tables']['profiles']['Row'] | null;
  guest_name?: string | null;
  is_guest_booking?: boolean | null;
};

export function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalRevenue: 0,
    activeStaff: 0,
    upcomingAppointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
    loadStats();
  }, [selectedDate]);

  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services(*),
          stylist:stylists(*, profile:profiles(*)),
          customer:profiles(*)
        `)
        .eq('appointment_date', selectedDate)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAppointments((data as any) || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Calculate date 30 days ago for revenue calculation
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      const { data: todayAppts } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', today)
        .neq('status', 'cancelled');

      const { data: upcomingAppts } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', today)
        .neq('status', 'cancelled');

      // Updated revenue calculation:
      // - Only completed appointments
      // - Only paid appointments
      // - From the last 30 days
      const { data: revenue } = await supabase
        .from('appointments')
        .select('total_amount')
        .eq('status', 'completed')
        .eq('payment_status', 'paid')
        .gte('appointment_date', thirtyDaysAgoStr);

      const { data: staff } = await supabase
        .from('stylists')
        .select('*')
        .eq('active', true);

      setStats({
        todayAppointments: todayAppts?.length || 0,
        totalRevenue: revenue?.reduce((sum, a) => sum + Number(a.total_amount), 0) || 0,
        activeStaff: staff?.length || 0,
        upcomingAppointments: upcomingAppts?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const groupAppointmentsByHour = () => {
    const grouped: { [key: string]: Appointment[] } = {};
    appointments.forEach((apt) => {
      const hour = apt.start_time.split(':')[0];
      if (!grouped[hour]) grouped[hour] = [];
      grouped[hour].push(apt);
    });
    return grouped;
  };

  const groupedAppointments = groupAppointmentsByHour();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of all bookings and business metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Today's Bookings</span>
            <CalendarIcon className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.todayAppointments}</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Upcoming</span>
            <Clock className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.upcomingAppointments}</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Active Staff</span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.activeStaff}</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Revenue (Last 30 Days)</span>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">${stats.totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">Completed & Paid only</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Daily Schedule</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-600">Loading schedule...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No appointments scheduled for this date</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedAppointments)
              .sort()
              .map((hour) => (
                <div key={hour} className="border-l-4 border-slate-300 pl-6">
                  <div className="text-sm font-semibold text-slate-600 mb-3">
                    {`${hour.padStart(2, '0')}:00`}
                  </div>
                  <div className="space-y-3">
                    {groupedAppointments[hour].map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-slate-50 rounded-lg p-4 border-l-4 border-slate-900"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-slate-900">
                                {apt.start_time} - {apt.end_time}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(apt.status)}`}>
                                {apt.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 font-medium">
                              {apt.service?.name || 'Service Deleted'}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-600">
                              {apt.is_guest_booking ? 'Guest:' : 'Customer:'}
                            </span>
                            <p className="font-medium text-slate-900">
                              {apt.is_guest_booking
                                ? (apt.guest_name || 'Guest')
                                : (apt.customer?.full_name || 'Unknown')}
                            </p>
                            {apt.is_guest_booking && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                                Guest
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-slate-600">Barber:</span>
                            <p className="font-medium text-slate-900">
                              {apt.stylist?.profile?.full_name || 'Unassigned'}
                            </p>
                          </div>
                        </div>
                        {apt.special_requests && (
                          <div className="mt-2 pt-2 border-t border-slate-200">
                            <p className="text-sm text-slate-600">
                              <strong>Notes:</strong> {apt.special_requests}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
