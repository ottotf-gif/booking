import { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, ChevronLeft, ChevronRight, List, CalendarDays, AlertCircle, X, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  service: Database['public']['Tables']['services']['Row'] | null;
  customer: Database['public']['Tables']['profiles']['Row'] | null;
};

type ViewMode = 'week' | 'list';
type StatusFilter = 'upcoming' | 'completed' | 'all';

const DAY_LABELS_SHORT = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];

function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function formatYmd(d: Date): string {
  return d.toISOString().split('T')[0];
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function BarberAppointmentsView() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [weekAppts, setWeekAppts] = useState<Appointment[]>([]);
  const [weekLoading, setWeekLoading] = useState(true);

  const [filter, setFilter] = useState<StatusFilter>('upcoming');
  const [listAppts, setListAppts] = useState<Appointment[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [detailApt, setDetailApt] = useState<Appointment | null>(null);

  useEffect(() => {
    if (user && viewMode === 'week') loadWeek();
  }, [user, weekStart, viewMode]);

  useEffect(() => {
    if (user && viewMode === 'list') loadList();
  }, [user, filter, viewMode]);

  const loadWeek = async () => {
    if (!user) return;
    setWeekLoading(true);
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const { data, error } = await supabase
        .from('appointments')
        .select(`*, service:services(*), customer:profiles(*)`)
        .eq('stylist_id', user.id)
        .gte('appointment_date', formatYmd(weekStart))
        .lte('appointment_date', formatYmd(weekEnd))
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true });
      if (error) throw error;
      setWeekAppts((data as any) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setWeekLoading(false);
    }
  };

  const loadList = async () => {
    if (!user) return;
    setListLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select(`*, service:services(*), customer:profiles(*)`)
        .eq('stylist_id', user.id)
        .order('appointment_date', { ascending: filter !== 'completed' })
        .order('start_time', { ascending: true });

      const today = formatYmd(new Date());
      if (filter === 'upcoming') {
        query = query.gte('appointment_date', today).neq('status', 'cancelled').neq('status', 'completed');
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed');
      }
      const { data, error } = await query;
      if (error) throw error;
      setListAppts((data as any) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setListLoading(false);
    }
  };

  const handleMarkCompletedAndPaid = async (apt: Appointment) => {
    setUpdatingId(apt.id);
    try {
      const fullyDone = apt.status === 'completed' && apt.payment_status === 'paid';
      const newValues = fullyDone
        ? { status: 'confirmed' as const, payment_status: 'pending' as const }
        : { status: 'completed' as const, payment_status: 'paid' as const };
      const { error } = await supabase.from('appointments').update(newValues).eq('id', apt.id);
      if (error) throw error;

      // Reload data
      if (viewMode === 'week') await loadWeek(); else await loadList();

      // Update detail modal if open
      if (detailApt && detailApt.id === apt.id) {
        setDetailApt({ ...apt, ...newValues });
      }
    } catch (e: any) {
      alert(e.message || 'Misslyckades att uppdatera');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Mitt schema</h1>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Vecka
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <List className="w-4 h-4" />
            Lista
          </button>
        </div>
      </div>

      {viewMode === 'week' ? (
        <WeekView
          weekStart={weekStart}
          appointments={weekAppts}
          loading={weekLoading}
          onPrev={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}
          onNext={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}
          onToday={() => setWeekStart(getMonday(new Date()))}
          onOpenDetail={setDetailApt}
        />
      ) : (
        <ListView
          appointments={listAppts}
          loading={listLoading}
          filter={filter}
          onFilterChange={setFilter}
          onOpenDetail={setDetailApt}
        />
      )}

      {detailApt && (
        <AppointmentDetailModal
          apt={detailApt}
          updating={updatingId === detailApt.id}
          onClose={() => setDetailApt(null)}
          onMarkDone={handleMarkCompletedAndPaid}
        />
      )}
    </div>
  );
}

// ============================================================================
// DETAIL MODAL
// ============================================================================
function AppointmentDetailModal({
  apt, updating, onClose, onMarkDone,
}: {
  apt: Appointment;
  updating: boolean;
  onClose: () => void;
  onMarkDone: (apt: Appointment) => void;
}) {
  const fullyDone = apt.status === 'completed' && apt.payment_status === 'paid';
  const customerName = apt.is_guest_booking ? (apt.guest_name || 'Gäst') : (apt.customer?.full_name || 'Okänd');
  const customerEmail = apt.is_guest_booking ? apt.guest_email : apt.customer?.email;
  const customerPhone = apt.is_guest_booking ? apt.guest_phone : apt.customer?.phone;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[95vh] overflow-y-auto">
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-200">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-0.5">Bokning</p>
            <h2 className="text-xl font-bold text-slate-900">{customerName}</h2>
            {apt.is_guest_booking && (
              <span className="inline-block mt-1 text-xs px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                Gäst
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 -m-1.5 hover:bg-slate-100 rounded-lg" aria-label="Stäng">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPill status={apt.status} />
            <PaymentPill status={apt.payment_status} />
          </div>

          {/* Details */}
          <div className="space-y-3">
            <DetailRow icon={Calendar} label="Datum">
              <p>{new Date(apt.appointment_date + 'T00:00:00').toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </DetailRow>
            <DetailRow icon={Clock} label="Tid">
              <p>{apt.start_time.substring(0, 5)} – {apt.end_time.substring(0, 5)}</p>
            </DetailRow>
            <DetailRow icon={User} label="Tjänst">
              <p>{apt.service?.name || 'Borttagen tjänst'}</p>
              <p className="text-xs text-slate-500">{apt.total_amount} kr</p>
            </DetailRow>
            {customerEmail && (
              <DetailRow icon={Mail} label="E-post">
                <a href={`mailto:${customerEmail}`} className="text-slate-700 hover:underline">{customerEmail}</a>
              </DetailRow>
            )}
            {customerPhone && (
              <DetailRow icon={Phone} label="Telefon">
                <a href={`tel:${customerPhone}`} className="text-slate-700 hover:underline">{customerPhone}</a>
              </DetailRow>
            )}
          </div>

          {apt.special_requests && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Önskemål</p>
              <p className="text-sm text-slate-700">{apt.special_requests}</p>
            </div>
          )}
        </div>

        {/* Footer with action */}
        {apt.status !== 'cancelled' && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-100 font-medium"
            >
              Stäng
            </button>
            <button
              onClick={() => onMarkDone(apt)}
              disabled={updating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-slate-900 bg-white text-slate-900 rounded-lg hover:bg-slate-900 hover:text-white disabled:opacity-50 font-medium transition-colors"
            >
              {fullyDone ? (
                <><XCircle className="w-4 h-4" /> Ångra</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Klar & betald</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-700" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
        <div className="text-sm text-slate-900 font-medium">{children}</div>
      </div>
    </div>
  );
}

// ============================================================================
// WEEK VIEW
// ============================================================================
function WeekView({
  weekStart, appointments, loading, onPrev, onNext, onToday, onOpenDetail,
}: {
  weekStart: Date;
  appointments: Appointment[];
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenDetail: (apt: Appointment) => void;
}) {
  const todayStr = formatYmd(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const isThisWeek = weekStart <= new Date() && new Date() <= weekEnd;

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const nextAppt = appointments
    .filter(a => {
      if (a.appointment_date < todayStr) return false;
      if (a.appointment_date > todayStr) return true;
      return toMinutes(a.start_time) >= nowMin;
    })
    .sort((a, b) => {
      if (a.appointment_date !== b.appointment_date) return a.appointment_date.localeCompare(b.appointment_date);
      return a.start_time.localeCompare(b.start_time);
    })[0];

  const byDate = new Map<string, Appointment[]>();
  appointments.forEach(a => {
    const list = byDate.get(a.appointment_date) || [];
    list.push(a);
    byDate.set(a.appointment_date, list);
  });

  const HOUR_START = 8;
  const HOUR_END = 20;
  const QUARTER_PX = 15; // 15px per 15 minutes = 60px per hour

  return (
    <div className="space-y-4">
      {/* Nav */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-3 sm:p-4">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">
            {weekStart.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
          </p>
          <p className="text-base sm:text-lg font-semibold text-slate-900">
            {weekStart.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })} – {weekEnd.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="p-2 hover:bg-slate-100 rounded-md" aria-label="Föregående vecka">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onToday}
            disabled={isThisWeek}
            className="px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40"
          >
            Idag
          </button>
          <button onClick={onNext} className="p-2 hover:bg-slate-100 rounded-md" aria-label="Nästa vecka">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Next customer */}
      {nextAppt && (
        <button
          onClick={() => onOpenDetail(nextAppt)}
          className="block w-full text-left bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-lg p-4 sm:p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-slate-300 mb-0.5">Nästa kund</p>
              <h3 className="text-lg sm:text-xl font-bold truncate">
                {nextAppt.is_guest_booking ? (nextAppt.guest_name || 'Gäst') : (nextAppt.customer?.full_name || 'Okänd')}
              </h3>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-slate-300">
                {nextAppt.appointment_date === todayStr
                  ? 'Idag'
                  : new Date(nextAppt.appointment_date + 'T00:00:00').toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
              <p className="text-lg sm:text-xl font-bold">{nextAppt.start_time.substring(0, 5)}</p>
            </div>
          </div>
          <p className="text-sm text-slate-200">{nextAppt.service?.name || 'Borttagen tjänst'} · {nextAppt.total_amount} kr</p>
        </button>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-600">Laddar...</div>
      ) : (
        <>
          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {days.map(d => {
              const dStr = formatYmd(d);
              const list = (byDate.get(dStr) || []).sort((a, b) => a.start_time.localeCompare(b.start_time));
              const isToday = dStr === todayStr;
              return (
                <div key={dStr} className={`bg-white border rounded-lg overflow-hidden ${isToday ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200'}`}>
                  <div className={`px-3 py-2 flex items-center justify-between ${isToday ? 'bg-slate-900 text-white' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${isToday ? 'text-slate-300' : 'text-slate-500'}`}>
                        {DAY_LABELS_SHORT[d.getDay()]}
                      </span>
                      <span className="text-sm font-bold">{d.getDate()}</span>
                      {isToday && <span className="text-[10px] uppercase font-bold tracking-wider">Idag</span>}
                    </div>
                    {list.length > 0 && (
                      <span className={`text-xs font-medium ${isToday ? 'text-slate-300' : 'text-slate-500'}`}>
                        {list.length} bok.
                      </span>
                    )}
                  </div>
                  {list.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-slate-400">Inga bokningar</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {list.map(apt => (
                        <MobileAptCard
                          key={apt.id}
                          apt={apt}
                          onClick={() => onOpenDetail(apt)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop timeline */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 sticky top-0 bg-slate-50 z-10">
              <div></div>
              {days.map(d => {
                const isToday = formatYmd(d) === todayStr;
                return (
                  <div key={d.toISOString()} className={`p-2 text-center border-l border-slate-200 ${isToday ? 'bg-slate-900 text-white' : ''}`}>
                    <div className={`text-xs uppercase tracking-wider ${isToday ? 'text-slate-300' : 'text-slate-500'}`}>
                      {DAY_LABELS_SHORT[d.getDay()]}
                    </div>
                    <div className="text-sm font-bold">{d.getDate()}</div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-[60px_repeat(7,1fr)] relative" style={{ height: `${(HOUR_END - HOUR_START) * 4 * QUARTER_PX}px` }}>
              {/* Hour labels */}
              <div className="border-r border-slate-200">
                {Array.from({ length: HOUR_END - HOUR_START }).map((_, i) => (
                  <div key={i} className="text-xs text-slate-500 text-right pr-2 border-b border-slate-200" style={{ height: `${4 * QUARTER_PX}px` }}>
                    {(HOUR_START + i).toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map(d => {
                const dStr = formatYmd(d);
                const list = byDate.get(dStr) || [];

                // Mark which quarters are occupied (for visual grey-out)
                const occupiedQuarters = new Set<number>();
                list.forEach(apt => {
                  const s = toMinutes(apt.start_time);
                  const e = toMinutes(apt.end_time);
                  for (let m = s; m < e; m += 15) {
                    occupiedQuarters.add(m);
                  }
                });

                return (
                  <div key={dStr} className="relative border-l border-slate-200">
                    {/* Quarter-hour grid background */}
                    {Array.from({ length: (HOUR_END - HOUR_START) * 4 }).map((_, i) => {
                      const minutesFromStart = i * 15;
                      const absMin = HOUR_START * 60 + minutesFromStart;
                      const isOccupied = occupiedQuarters.has(absMin);
                      const isHourMark = minutesFromStart % 60 === 0;
                      return (
                        <div
                          key={i}
                          className={`${isHourMark ? 'border-t border-slate-200' : 'border-t border-slate-100 border-dashed'} ${isOccupied ? 'bg-slate-100' : ''}`}
                          style={{ height: `${QUARTER_PX}px` }}
                        />
                      );
                    })}

                    {/* Appointment blocks */}
                    {list.map(apt => {
                      const start = toMinutes(apt.start_time);
                      const end = toMinutes(apt.end_time);
                      const top = ((start - HOUR_START * 60) / 15) * QUARTER_PX;
                      const height = ((end - start) / 15) * QUARTER_PX;
                      if (top < 0 || top > (HOUR_END - HOUR_START) * 4 * QUARTER_PX) return null;
                      const color = aptColors(apt);
                      return (
                        <button
                          key={apt.id}
                          onClick={() => onOpenDetail(apt)}
                          className={`absolute left-1 right-1 rounded p-1.5 overflow-hidden text-xs cursor-pointer transition-shadow hover:shadow-md text-left ${color.bg} ${color.border} border-l-2`}
                          style={{ top: `${top}px`, height: `${Math.max(height, 24)}px` }}
                          title={`${apt.start_time.substring(0,5)}–${apt.end_time.substring(0,5)} · ${apt.is_guest_booking ? apt.guest_name : apt.customer?.full_name} · ${apt.service?.name}`}
                        >
                          <p className={`font-semibold truncate ${color.text}`}>
                            {apt.start_time.substring(0, 5)}
                          </p>
                          <p className={`truncate ${color.text}`}>
                            {apt.is_guest_booking ? apt.guest_name : apt.customer?.full_name}
                          </p>
                          {height > 50 && (
                            <p className={`truncate text-[10px] opacity-75 ${color.text}`}>
                              {apt.service?.name}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-200 bg-slate-50">
              Klicka på en bokning för att se detaljer.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function aptColors(apt: Appointment) {
  const isPaid = apt.payment_status === 'paid';
  const isDone = apt.status === 'completed';
  if (isDone && isPaid) return { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-900' };
  if (isDone) return { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-900' };
  if (apt.status === 'pending') return { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-900' };
  return { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-900' };
}

function MobileAptCard({ apt, onClick }: { apt: Appointment; onClick: () => void }) {
  const color = aptColors(apt);
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border-l-4 ${color.border} hover:bg-slate-50 transition-colors`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {apt.is_guest_booking ? (apt.guest_name || 'Gäst') : (apt.customer?.full_name || 'Okänd')}
          </p>
          <p className="text-xs text-slate-500">{apt.service?.name || 'Borttagen tjänst'}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-slate-900">{apt.start_time.substring(0, 5)}</p>
          <p className="text-xs text-slate-500">{apt.total_amount} kr</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
        <StatusPill status={apt.status} />
        <PaymentPill status={apt.payment_status} />
      </div>
    </button>
  );
}

// ============================================================================
// LIST VIEW
// ============================================================================
function ListView({
  appointments, loading, filter, onFilterChange, onOpenDetail,
}: {
  appointments: Appointment[]; loading: boolean; filter: StatusFilter;
  onFilterChange: (f: StatusFilter) => void;
  onOpenDetail: (apt: Appointment) => void;
}) {
  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(['upcoming', 'completed', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {f === 'upcoming' ? 'Kommande' : f === 'completed' ? 'Utförda' : 'Alla'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-600">Laddar...</div>
      ) : appointments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">Inga bokningar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(apt => (
            <button
              key={apt.id}
              onClick={() => onOpenDetail(apt)}
              className="block w-full text-left bg-white rounded-lg border border-slate-200 p-4 sm:p-5 hover:border-slate-400 hover:shadow-sm transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                    {apt.is_guest_booking ? (apt.guest_name || 'Gäst') : (apt.customer?.full_name || 'Okänd')}
                  </h3>
                  <p className="text-sm text-slate-600">{apt.service?.name || 'Borttagen tjänst'}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-base sm:text-lg font-bold text-slate-900">{apt.total_amount} kr</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{new Date(apt.appointment_date + 'T00:00:00').toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{apt.start_time.substring(0, 5)} – {apt.end_time.substring(0, 5)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-100">
                <StatusPill status={apt.status} />
                <PaymentPill status={apt.payment_status} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PILLS
// ============================================================================
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:   { label: 'Väntande',  cls: 'bg-yellow-100 text-yellow-800 ring-yellow-200' },
    confirmed: { label: 'Bekräftad', cls: 'bg-green-100 text-green-800 ring-green-200' },
    completed: { label: 'Utförd',    cls: 'bg-blue-100 text-blue-800 ring-blue-200' },
    cancelled: { label: 'Avbokad',   cls: 'bg-red-100 text-red-800 ring-red-200' },
    no_show:   { label: 'Utebliven', cls: 'bg-slate-100 text-slate-800 ring-slate-200' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-800 ring-slate-200' };
  return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset ${s.cls}`}>{s.label}</span>;
}

function PaymentPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:  { label: 'Obetald',     cls: 'bg-orange-100 text-orange-800 ring-orange-200' },
    paid:     { label: 'Betald',      cls: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
    refunded: { label: 'Återbetald',  cls: 'bg-purple-100 text-purple-800 ring-purple-200' },
    failed:   { label: 'Misslyckad',  cls: 'bg-red-100 text-red-800 ring-red-200' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-800 ring-slate-200' };
  return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset ${s.cls}`}>{s.label}</span>;
}