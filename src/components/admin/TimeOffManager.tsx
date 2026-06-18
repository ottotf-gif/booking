import { useEffect, useState } from 'react';
import { CalendarX, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TimeOff {
  id: string;
  stylist_id: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

interface TimeOffManagerProps {
  stylistId: string;
}

export function TimeOffManager({ stylistId }: TimeOffManagerProps) {
  const [items, setItems] = useState<TimeOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [partialDay, setPartialDay] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('14:00');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { load(); }, [stylistId]);

  const load = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('stylist_time_off')
        .select('*')
        .eq('stylist_id', stylistId)
        .gte('end_date', today)
        .order('start_date');
      if (error) throw error;
      setItems((data as any) || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPartialDay(false);
    setStart(''); setEnd(''); setStartTime('12:00'); setEndTime('14:00'); setReason('');
    setShowForm(false);
    setError('');
  };

  const add = async () => {
    setError('');
    if (!start) { setError('Välj minst ett datum.'); return; }

    const effectiveEnd = partialDay ? start : (end || start);

    if (!partialDay && end && start > end) {
      setError('Startdatum måste vara före slutdatum.');
      return;
    }
    if (partialDay && startTime >= endTime) {
      setError('Starttiden måste vara före sluttiden.');
      return;
    }

    setAdding(true);
    try {
      const payload: any = {
        stylist_id: stylistId,
        start_date: start,
        end_date: effectiveEnd,
        reason: reason || null,
        approved: true,
      };
      if (partialDay) {
        payload.start_time = startTime;
        payload.end_time = endTime;
      }

      const { error } = await supabase.from('stylist_time_off').insert(payload);
      if (error) throw error;
      resetForm();
      await load();
    } catch (e: any) {
      setError(e.message || 'Kunde inte spara ledighet');
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Ta bort den här ledigheten?')) return;
    try {
      const { error } = await supabase.from('stylist_time_off').delete().eq('id', id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      alert(e.message || 'Kunde inte ta bort');
    }
  };

  const formatItem = (item: TimeOff) => {
    const sameDay = item.start_date === item.end_date;
    const dateStr = sameDay
      ? new Date(item.start_date).toLocaleDateString('sv-SE')
      : `${new Date(item.start_date).toLocaleDateString('sv-SE')} – ${new Date(item.end_date).toLocaleDateString('sv-SE')}`;

    if (item.start_time && item.end_time && sameDay) {
      return `${dateStr} kl. ${item.start_time.substring(0,5)}–${item.end_time.substring(0,5)}`;
    }
    return dateStr;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-slate-900 flex items-center gap-2">
          <CalendarX className="w-4 h-4" /> Lediga dagar / tider
        </h4>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Lägg till
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
          {error && <p className="text-red-600 text-xs">{error}</p>}

          {/* Mode toggle */}
          <div className="flex gap-1 bg-white border border-slate-200 rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setPartialDay(false)}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                !partialDay ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Hel dag / dagar
            </button>
            <button
              type="button"
              onClick={() => setPartialDay(true)}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                partialDay ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tidsintervall en dag
            </button>
          </div>

          {!partialDay ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Från</label>
                <input
                  type="date"
                  value={start}
                  min={todayStr}
                  onChange={e => setStart(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Till</label>
                <input
                  type="date"
                  value={end}
                  min={start || todayStr}
                  onChange={e => setEnd(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Datum</label>
                <input
                  type="date"
                  value={start}
                  min={todayStr}
                  onChange={e => setStart(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Från kl.</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Till kl.</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Anledning (valfri) – t.ex. läkarbesök, semester"
            className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={add}
              disabled={adding}
              className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
            >
              {adding ? 'Sparar...' : 'Lägg till'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Laddar...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500 italic">Inga inplanerade lediga dagar.</p>
      ) : (
        <ul className="space-y-1">
          {items.map(item => (
            <li key={item.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-md px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-slate-900">{formatItem(item)}</p>
                {item.reason && <p className="text-xs text-slate-500">{item.reason}</p>}
              </div>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                aria-label="Ta bort"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}