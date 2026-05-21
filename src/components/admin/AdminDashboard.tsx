import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Users, Clock, TrendingUp, BarChart3, Star, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  service: Database['public']['Tables']['services']['Row'] | null;
  stylist: (Database['public']['Tables']['stylists']['Row'] & {
    profile: Database['public']['Tables']['profiles']['Row'];
  }) | null;
  customer: Database['public']['Tables']['profiles']['Row'] | null;
};

interface RatingRow {
  id: string;
  salon_rating: number;
  barber_rating: number;
  comment: string | null;
  created_at: string;
  stylist_id: string | null;
  stylist_name?: string;
}

const DAY_NAMES = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];

export function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const [todayCount, setTodayCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [activeStaff, setActiveStaff] = useState(0);
  const [utilization, setUtilization] = useState(0);
  const [monthlyBookings, setMonthlyBookings] = useState(0);

  const [hourStats, setHourStats] = useState<{ hour: number; count: number }[]>([]);
  const [dayStats, setDayStats] = useState<{ day: number; count: number }[]>([]);

  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [avgSalon, setAvgSalon] = useState(0);
  const [stylistAvgs, setStylistAvgs] = useState<{ stylist_id: string; name: string; avg: number; count: number }[]>([]);

  useEffect(() => { loadDaySchedule(); }, [selectedDate]);
  useEffect(() => { loadAllStats(); }, []);

  const loadDaySchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`*, service:services(*), stylist:stylists(*, profile:profiles(*)), customer:profiles(*)`)
        .eq('appointment_date', selectedDate)
        .order('start_time', { ascending: true });
      if (error) throw error;
      setAppointments((data as any) || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadAllStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const { data: todayAppts } = await supabase
        .from('appointments').select('id')
        .eq('appointment_date', today).neq('status', 'cancelled');
      setTodayCount(todayAppts?.length || 0);

      const { data: upcomingAppts } = await supabase
        .from('appointments').select('id')
        .gte('appointment_date', today).neq('status', 'cancelled');
      setUpcomingCount(upcomingAppts?.length || 0);

      const { data: staff } = await supabase
        .from('stylists').select('id, profile:profiles(full_name)').eq('active', true);
      setActiveStaff(staff?.length || 0);

      const { data: monthAppts } = await supabase
        .from('appointments')
        .select('appointment_date, start_time, end_time, status, stylist_id, service:services(duration_minutes)')
        .gte('appointment_date', monthStartStr).lte('appointment_date', today)
        .neq('status', 'cancelled');
      setMonthlyBookings(monthAppts?.length || 0);

      const { data: availability } = await supabase
        .from('stylist_availability')
        .select('stylist_id, day_of_week, start_time, end_time, is_available')
        .eq('is_available', true);

      const activeStylistIds = new Set((staff || []).map((s: any) => s.id));
      const availMap = new Map<string, number>();
      (availability || []).forEach((row: any) => {
        if (!activeStylistIds.has(row.stylist_id)) return;
        const [sh, sm] = row.start_time.split(':').map(Number);
        const [eh, em] = row.end_time.split(':').map(Number);
        const key = `${row.stylist_id}|${row.day_of_week}`;
        availMap.set(key, (availMap.get(key) || 0) + ((eh*60+em) - (sh*60+sm)));
      });

      let availableMinutes = 0;
      const cursor = new Date(monthStart);
      const endCursor = new Date(today);
      while (cursor <= endCursor) {
        const dow = cursor.getDay();
        activeStylistIds.forEach(sid => { availableMinutes += availMap.get(`${sid}|${dow}`) || 0; });
        cursor.setDate(cursor.getDate() + 1);
      }

      const bookedMinutes = (monthAppts || []).reduce((sum, a: any) => {
        const dur = a.service?.duration_minutes
          || ((parseInt(a.end_time.substring(0,2))*60+parseInt(a.end_time.substring(3,5))) - (parseInt(a.start_time.substring(0,2))*60+parseInt(a.start_time.substring(3,5))));
        return sum + (dur || 0);
      }, 0);

      setUtilization(availableMinutes > 0 ? Math.round((bookedMinutes / availableMinutes) * 100) : 0);

      const byHour = new Map<number, number>();
      const byDay = new Map<number, number>();
      (monthAppts || []).forEach((a: any) => {
        const hour = parseInt(a.start_time.substring(0, 2));
        byHour.set(hour, (byHour.get(hour) || 0) + 1);
        const dow = new Date(a.appointment_date + 'T00:00:00').getDay();
        byDay.set(dow, (byDay.get(dow) || 0) + 1);
      });

      const hourArr: { hour: number; count: number }[] = [];
      for (let h = 8; h <= 20; h++) hourArr.push({ hour: h, count: byHour.get(h) || 0 });
      setHourStats(hourArr);

      const dayArr: { day: number; count: number }[] = [];
      [1, 2, 3, 4, 5, 6, 0].forEach(d => dayArr.push({ day: d, count: byDay.get(d) || 0 }));
      setDayStats(dayArr);

      const sixtyAgo = new Date(); sixtyAgo.setDate(sixtyAgo.getDate() - 60);
      const { data: rRows } = await supabase
        .from('appointment_ratings')
        .select(`id, salon_rating, barber_rating, comment, created_at, stylist_id, stylist:stylists(profile:profiles(full_name))`)
        .gte('created_at', sixtyAgo.toISOString())
        .order('created_at', { ascending: false });

      const ratingsList: RatingRow[] = ((rRows as any) || []).map((r: any) => ({
        ...r, stylist_name: r.stylist?.profile?.full_name || 'Okänd',
      }));
      setRatings(ratingsList);

      if (ratingsList.length > 0) {
        setAvgSalon(ratingsList.reduce((s, r) => s + r.salon_rating, 0) / ratingsList.length);
        const perStylist = new Map<string, { name: string; sum: number; count: number }>();
        ratingsList.forEach((r) => {
          if (!r.stylist_id) return;
          const e = perStylist.get(r.stylist_id) || { name: r.stylist_name || '', sum: 0, count: 0 };
          e.sum += r.barber_rating; e.count += 1;
          perStylist.set(r.stylist_id, e);
        });
        const arr = Array.from(perStylist.entries()).map(([id, e]) => ({
          stylist_id: id, name: e.name, avg: e.sum / e.count, count: e.count,
        })).sort((a, b) => b.avg - a.avg);
        setStylistAvgs(arr);
      }
    } catch (e) { console.error('Error loading stats:', e); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':   return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default:          return 'bg-slate-100 text-slate-800 border-slate-200';
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

  const grouped = groupAppointmentsByHour();
  const maxHour = Math.max(...hourStats.map(h => h.count), 1);
  const maxDay = Math.max(...dayStats.map(d => d.count), 1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Översikt</h1>
        <p className="text-slate-600 mt-1 text-sm sm:text-base">Bokningar och statistik för verksamheten</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Bokningar idag" value={todayCount} icon={CalendarIcon} />
        <StatCard label="Kommande" value={upcomingCount} icon={Clock} />
        <StatCard label="Aktiva barbers" value={activeStaff} icon={Users} />
        <StatCard
          label="Beläggning denna månad"
          value={`${utilization}%`}
          icon={Activity}
          subtitle={`${monthlyBookings} bokningar`}
          highlight={utilization >= 70 ? 'green' : utilization >= 40 ? 'amber' : 'red'}
        />
      </div>

      {/* === SCHEMA FÖR DAGEN (moved to top) === */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Schema för dagen</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-600">Laddar...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">Inga bokningar denna dag</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(grouped).sort().map((hour) => (
              <div key={hour} className="border-l-4 border-slate-300 pl-4">
                <div className="text-sm font-semibold text-slate-600 mb-2">
                  {`${hour.padStart(2, '0')}:00`}
                </div>
                <div className="space-y-2">
                  {grouped[hour].map((apt) => (
                    <div key={apt.id} className="bg-slate-50 rounded-lg p-3 sm:p-4 border-l-4 border-slate-900">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="font-semibold text-slate-900 text-sm">
                            {apt.start_time.substring(0,5)} – {apt.end_time.substring(0,5)}
                          </span>
                          <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(apt.status)}`}>
                            {apt.status}
                          </span>
                          <p className="text-sm text-slate-700 font-medium mt-1">
                            {apt.service?.name || 'Borttagen tjänst'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-slate-500 text-xs">Kund</span>
                          <p className="font-medium text-slate-900">
                            {apt.is_guest_booking ? (apt.guest_name || 'Gäst') : (apt.customer?.full_name || 'Okänd')}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs">Barber</span>
                          <p className="font-medium text-slate-900">
                            {apt.stylist?.profile?.full_name || 'Okänd'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === STATISTIK === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">Populära tider</h2>
            <span className="text-xs text-slate-500 ml-auto">Denna månad</span>
          </div>
          {monthlyBookings === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Inga bokningar denna månad än.</p>
          ) : (
            <div className="space-y-1.5">
              {hourStats.map(({ hour, count }) => {
                const pct = (count / maxHour) * 100;
                const color = count === 0 ? 'bg-slate-200'
                  : count >= maxHour * 0.7 ? 'bg-green-500'
                  : count >= maxHour * 0.3 ? 'bg-amber-400' : 'bg-red-300';
                return (
                  <div key={hour} className="flex items-center gap-2 text-sm">
                    <span className="w-10 text-slate-600 font-mono text-xs">{hour.toString().padStart(2, '0')}:00</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-5 relative overflow-hidden">
                      <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-slate-700 font-medium text-xs">{count}</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-3 text-xs text-slate-500 pt-3 mt-2 border-t border-slate-100">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Topptid</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full"></span>Medel</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-300 rounded-full"></span>Svaga</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">Populära dagar</h2>
            <span className="text-xs text-slate-500 ml-auto">Denna månad</span>
          </div>
          {monthlyBookings === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Inga bokningar denna månad än.</p>
          ) : (
            <div className="space-y-2">
              {dayStats.map(({ day, count }) => {
                const pct = (count / maxDay) * 100;
                const color = count === 0 ? 'bg-slate-200'
                  : count >= maxDay * 0.7 ? 'bg-green-500'
                  : count >= maxDay * 0.3 ? 'bg-amber-400' : 'bg-red-300';
                return (
                  <div key={day} className="flex items-center gap-2 text-sm">
                    <span className="w-16 sm:w-20 text-slate-600 text-xs sm:text-sm">{DAY_NAMES[day]}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-5 relative overflow-hidden">
                      <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-slate-700 font-medium text-xs">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* === BETYG === */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <h2 className="font-semibold text-slate-900">Betyg</h2>
          {ratings.length > 0 && (
            <span className="ml-auto text-sm text-slate-600">
              Salongen: <strong className="text-slate-900">{avgSalon.toFixed(1)}/5</strong> ({ratings.length} betyg)
            </span>
          )}
        </div>

        {ratings.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">Inga betyg ännu.</p>
        ) : (
          <>
            {stylistAvgs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {stylistAvgs.map(s => (
                  <div key={s.stylist_id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-slate-900 truncate">{s.name}</span>
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <strong>{s.avg.toFixed(1)}</strong>
                      <span className="text-slate-500">({s.count})</span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            <details className="text-sm">
              <summary className="cursor-pointer text-slate-700 hover:text-slate-900 font-medium">
                Visa kommentarer ({ratings.filter(r => r.comment).length})
              </summary>
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {ratings.filter(r => r.comment).map(r => (
                  <div key={r.id} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1 text-xs text-slate-600 flex-wrap">
                      <span className="font-medium text-slate-900">{r.stylist_name}</span>
                      <span className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} className={`w-3 h-3 ${n <= r.barber_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                        ))}
                      </span>
                      <span>·</span>
                      <span>{new Date(r.created_at).toLocaleDateString('sv-SE')}</span>
                    </div>
                    <p className="text-sm text-slate-700">{r.comment}</p>
                  </div>
                ))}
              </div>
            </details>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, subtitle, highlight,
}: {
  label: string; value: number | string; icon: any; subtitle?: string;
  highlight?: 'green' | 'amber' | 'red';
}) {
  const valueColor = highlight === 'green' ? 'text-green-600'
    : highlight === 'amber' ? 'text-amber-600'
    : highlight === 'red' ? 'text-red-600' : 'text-slate-900';
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs sm:text-sm font-medium text-slate-600">{label}</span>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
      </div>
      <p className={`text-xl sm:text-3xl font-bold ${valueColor}`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}