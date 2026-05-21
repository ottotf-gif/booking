import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Star, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';
import { RatingModal } from './RatingModal';

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
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [ratingTarget, setRatingTarget] = useState<Appointment | null>(null);

  useEffect(() => { loadAppointments(); }, [profile, filter]);

  const loadAppointments = async () => {
    if (!profile) return;
    try {
      let query = supabase
        .from('appointments')
        .select(`*, service:services(*), stylist:stylists(*, profile:profiles(*)), customer:profiles(*)`);

      if (profile.role === 'customer') query = query.eq('customer_id', profile.id);
      else if (profile.role === 'stylist') query = query.eq('stylist_id', profile.id);

      const today = new Date().toISOString().split('T')[0];
      if (filter === 'upcoming') query = query.gte('appointment_date', today);
      else if (filter === 'past') query = query.lt('appointment_date', today);

      const { data, error } = await query.order('appointment_date', { ascending: filter !== 'past' });
      if (error) throw error;
      const list = (data as any) || [];
      setAppointments(list);

      if (profile.role === 'customer' && list.length > 0) {
        const ids = list.map((a: Appointment) => a.id);
        const { data: ratings } = await supabase
          .from('appointment_ratings')
          .select('appointment_id')
          .in('appointment_id', ids);
        setRatedIds(new Set((ratings || []).map((r: any) => r.appointment_id)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Är du säker på att du vill avboka?')) return;
    try {
      const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
      if (error) throw error;
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Kunde inte avboka');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-600">Laddar...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {profile?.role === 'admin' ? 'Bokningar' : 'Mina bokningar'}
        </h1>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(['upcoming', 'past', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {f === 'upcoming' ? 'Kommande' : f === 'past' ? 'Tidigare' : 'Alla'}
          </button>
        ))}
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">
            {filter === 'upcoming' ? 'Inga kommande bokningar' : filter === 'past' ? 'Inga tidigare bokningar' : 'Inga bokningar'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            const canRate = profile?.role === 'customer' && apt.status === 'completed' && !ratedIds.has(apt.id);
            const isPast = new Date(apt.appointment_date) < new Date(new Date().toISOString().split('T')[0]);
            const canCancel = !isPast && apt.status !== 'cancelled' && apt.status !== 'completed';

            return (
              <div key={apt.id} className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                      {apt.service?.name || 'Borttagen tjänst'}
                    </h3>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-900">
                    {apt.total_amount} kr
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
                  {profile?.role === 'customer' && apt.stylist && (
                    <div className="flex items-center gap-2 text-slate-600 sm:col-span-2">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span>{apt.stylist.profile.full_name}</span>
                    </div>
                  )}
                  {(profile?.role === 'stylist' || profile?.role === 'admin') && (
                    <div className="flex items-center gap-2 text-slate-600 sm:col-span-2">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {apt.is_guest_booking
                          ? `${apt.guest_name || 'Gäst'} (gäst)`
                          : apt.customer?.full_name || 'Okänd'}
                      </span>
                    </div>
                  )}
                </div>

                {apt.special_requests && (
                  <div className="mb-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                    <strong>Önskemål:</strong> {apt.special_requests}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-100">
                  <StatusPill status={apt.status} />
                  <PaymentPill status={apt.payment_status} />

                  <div className="ml-auto flex items-center gap-2">
                    {canRate && (
                      <button
                        onClick={() => setRatingTarget(apt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100"
                      >
                        <Star className="w-4 h-4" /> Lämna betyg
                      </button>
                    )}
                    {canCancel && profile?.role !== 'admin' && (
                      <button
                        onClick={() => handleCancel(apt.id)}
                        className="px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        Avboka
                      </button>
                    )}
                  </div>
                </div>

                {profile?.role === 'customer' && apt.status === 'completed' && ratedIds.has(apt.id) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>Tack för ditt betyg!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {ratingTarget && profile && ratingTarget.stylist && (
        <RatingModal
          appointmentId={ratingTarget.id}
          stylistId={ratingTarget.stylist.id}
          stylistName={ratingTarget.stylist.profile.full_name}
          customerId={profile.id}
          onClose={() => setRatingTarget(null)}
          onSubmitted={() => {
            setRatedIds(new Set([...ratedIds, ratingTarget.id]));
            setRatingTarget(null);
          }}
        />
      )}
    </div>
  );
}

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