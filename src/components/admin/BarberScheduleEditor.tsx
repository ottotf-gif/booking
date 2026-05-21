import { useEffect, useState } from 'react';
import { Plus, Trash2, Clock, Copy, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Shift {
  start_time: string;
  end_time: string;
}

interface DaySchedule {
  day_of_week: number; // 0 = Sunday ... 6 = Saturday
  enabled: boolean;
  shifts: Shift[];
}

interface BarberScheduleEditorProps {
  stylistId: string;
  onSaved?: () => void;
  embedded?: boolean;
  initialSchedule?: DaySchedule[];
  onChange?: (schedule: DaySchedule[]) => void;
}

const DAY_LABELS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
const DAY_SHORT  = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];

export const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day_of_week: 0, enabled: false, shifts: [{ start_time: '10:00', end_time: '16:00' }] },
  { day_of_week: 1, enabled: true,  shifts: [{ start_time: '09:00', end_time: '18:00' }] },
  { day_of_week: 2, enabled: true,  shifts: [{ start_time: '09:00', end_time: '18:00' }] },
  { day_of_week: 3, enabled: true,  shifts: [{ start_time: '09:00', end_time: '18:00' }] },
  { day_of_week: 4, enabled: true,  shifts: [{ start_time: '09:00', end_time: '18:00' }] },
  { day_of_week: 5, enabled: true,  shifts: [{ start_time: '09:00', end_time: '18:00' }] },
  { day_of_week: 6, enabled: false, shifts: [{ start_time: '10:00', end_time: '16:00' }] },
];

// ============================================================================
// PRESETS — quick templates
// ============================================================================
interface Preset {
  id: string;
  label: string;
  description: string;
  schedule: DaySchedule[];
}

const PRESETS: Preset[] = [
  {
    id: 'standard',
    label: 'Vardagar 9–18',
    description: 'Mån–Fre 09:00–18:00, helg ledigt',
    schedule: [
      { day_of_week: 0, enabled: false, shifts: [{ start_time: '10:00', end_time: '16:00' }] },
      { day_of_week: 1, enabled: true,  shifts: [{ start_time: '09:00', end_time: '18:00' }] },
      { day_of_week: 2, enabled: true,  shifts: [{ start_time: '09:00', end_time: '18:00' }] },
      { day_of_week: 3, enabled: true,  shifts: [{ start_time: '09:00', end_time: '18:00' }] },
      { day_of_week: 4, enabled: true,  shifts: [{ start_time: '09:00', end_time: '18:00' }] },
      { day_of_week: 5, enabled: true,  shifts: [{ start_time: '09:00', end_time: '18:00' }] },
      { day_of_week: 6, enabled: false, shifts: [{ start_time: '10:00', end_time: '16:00' }] },
    ],
  },
  {
    id: 'with_saturday',
    label: 'Vardagar + Lördag',
    description: 'Mån–Fre 09:00–18:00 + Lör 10:00–16:00',
    schedule: [
      { day_of_week: 0, enabled: false, shifts: [{ start_time: '10:00', end_time: '16:00' }] },
      { day_of_week: 1, enabled: true,  shifts: [{ start_time: '09:00', end_time: '18:00' }] },
      { day_of_week: 2, enabled: true,  shifts: [{ start_time: '09:00', end_time: '18:00' }] },
      { day_of_week: 3, enabled: true,  shifts: [{ start_time: '09:00', end_time: '18:00' }] },
      { day_of_week: 4, enabled: true,  shifts: [{ start_time: '09:00', end_time: '18:00' }] },
      { day_of_week: 5, enabled: true,  shifts: [{ start_time: '09:00', end_time: '18:00' }] },
      { day_of_week: 6, enabled: true,  shifts: [{ start_time: '10:00', end_time: '16:00' }] },
    ],
  },
  {
    id: 'lunch',
    label: 'Med lunchpaus',
    description: 'Mån–Fre 09–12 + 13–18, helg ledigt',
    schedule: [
      { day_of_week: 0, enabled: false, shifts: [{ start_time: '10:00', end_time: '16:00' }] },
      { day_of_week: 1, enabled: true,  shifts: [{ start_time: '09:00', end_time: '12:00' }, { start_time: '13:00', end_time: '18:00' }] },
      { day_of_week: 2, enabled: true,  shifts: [{ start_time: '09:00', end_time: '12:00' }, { start_time: '13:00', end_time: '18:00' }] },
      { day_of_week: 3, enabled: true,  shifts: [{ start_time: '09:00', end_time: '12:00' }, { start_time: '13:00', end_time: '18:00' }] },
      { day_of_week: 4, enabled: true,  shifts: [{ start_time: '09:00', end_time: '12:00' }, { start_time: '13:00', end_time: '18:00' }] },
      { day_of_week: 5, enabled: true,  shifts: [{ start_time: '09:00', end_time: '12:00' }, { start_time: '13:00', end_time: '18:00' }] },
      { day_of_week: 6, enabled: false, shifts: [{ start_time: '10:00', end_time: '16:00' }] },
    ],
  },
];

export function BarberScheduleEditor({
  stylistId, onSaved, embedded = false, initialSchedule, onChange,
}: BarberScheduleEditorProps) {
  const [schedule, setSchedule] = useState<DaySchedule[]>(initialSchedule || DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(!initialSchedule && !!stylistId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    if (initialSchedule || !stylistId) return;
    loadSchedule();
  }, [stylistId]);

  useEffect(() => { onChange?.(schedule); }, [schedule]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stylist_availability').select('*')
        .eq('stylist_id', stylistId)
        .order('day_of_week').order('start_time');
      if (error) throw error;

      const grouped: DaySchedule[] = [];
      for (let day = 0; day <= 6; day++) {
        const rows = (data || []).filter(r => r.day_of_week === day);
        const enabledRows = rows.filter(r => r.is_available);
        grouped.push({
          day_of_week: day,
          enabled: enabledRows.length > 0,
          shifts: enabledRows.length > 0
            ? enabledRows.map(r => ({
                start_time: r.start_time.substring(0, 5),
                end_time: r.end_time.substring(0, 5),
              }))
            : [{ start_time: '09:00', end_time: '18:00' }],
        });
      }
      setSchedule(grouped);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Kunde inte ladda schema');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: Preset) => {
    setSchedule(JSON.parse(JSON.stringify(preset.schedule)));
    setSavedMessage(`Mall "${preset.label}" tillämpad`);
    setTimeout(() => setSavedMessage(''), 2000);
  };

  const copyDayToAll = (fromDay: number) => {
    const source = schedule.find(d => d.day_of_week === fromDay);
    if (!source) return;
    if (!confirm(`Kopiera ${DAY_LABELS[fromDay]} (${source.enabled ? source.shifts.map(s => `${s.start_time}–${s.end_time}`).join(', ') : 'ledig'}) till alla andra dagar?`)) return;
    setSchedule(prev => prev.map(d => d.day_of_week === fromDay ? d : {
      ...d,
      enabled: source.enabled,
      shifts: JSON.parse(JSON.stringify(source.shifts)),
    }));
    setSavedMessage(`Kopierade ${DAY_LABELS[fromDay]} till alla dagar`);
    setTimeout(() => setSavedMessage(''), 2000);
  };

  const copyDayToWeekdays = (fromDay: number) => {
    const source = schedule.find(d => d.day_of_week === fromDay);
    if (!source) return;
    setSchedule(prev => prev.map(d => {
      if (d.day_of_week === fromDay) return d;
      if (d.day_of_week === 0 || d.day_of_week === 6) return d; // skip weekend
      return { ...d, enabled: source.enabled, shifts: JSON.parse(JSON.stringify(source.shifts)) };
    }));
    setSavedMessage(`Kopierade till vardagar`);
    setTimeout(() => setSavedMessage(''), 2000);
  };

  const toggleDay = (day: number) => {
    setSchedule(prev => prev.map(d => d.day_of_week === day ? { ...d, enabled: !d.enabled } : d));
  };

  const updateShift = (day: number, idx: number, field: 'start_time' | 'end_time', value: string) => {
    setSchedule(prev => prev.map(d => {
      if (d.day_of_week !== day) return d;
      const shifts = [...d.shifts];
      shifts[idx] = { ...shifts[idx], [field]: value };
      return { ...d, shifts };
    }));
  };

  const addShift = (day: number) => {
    setSchedule(prev => prev.map(d => {
      if (d.day_of_week !== day) return d;
      const last = d.shifts[d.shifts.length - 1];
      return { ...d, shifts: [...d.shifts, { start_time: last?.end_time || '13:00', end_time: '17:00' }] };
    }));
  };

  const removeShift = (day: number, idx: number) => {
    setSchedule(prev => prev.map(d => {
      if (d.day_of_week !== day) return d;
      if (d.shifts.length === 1) return d;
      return { ...d, shifts: d.shifts.filter((_, i) => i !== idx) };
    }));
  };

  const validate = (): string | null => {
    for (const day of schedule) {
      if (!day.enabled) continue;
      const sorted = [...day.shifts].sort((a, b) => a.start_time.localeCompare(b.start_time));
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].start_time >= sorted[i].end_time) {
          return `${DAY_LABELS[day.day_of_week]}: starttiden måste vara före sluttiden.`;
        }
        if (i > 0 && sorted[i].start_time < sorted[i - 1].end_time) {
          return `${DAY_LABELS[day.day_of_week]}: passen får inte överlappa.`;
        }
      }
    }
    return null;
  };

  const save = async () => {
    setError(''); setSavedMessage('');
    const v = validate();
    if (v) { setError(v); return; }

    setSaving(true);
    try {
      const { error: delErr } = await supabase
        .from('stylist_availability').delete().eq('stylist_id', stylistId);
      if (delErr) throw delErr;

      const rows = schedule.flatMap(d =>
        d.enabled
          ? d.shifts.map(s => ({
              stylist_id: stylistId, day_of_week: d.day_of_week,
              start_time: s.start_time, end_time: s.end_time, is_available: true,
            }))
          : [{
              stylist_id: stylistId, day_of_week: d.day_of_week,
              start_time: '00:00', end_time: '00:00', is_available: false,
            }]
      );

      if (rows.length > 0) {
        const { error: insErr } = await supabase.from('stylist_availability').insert(rows);
        if (insErr) throw insErr;
      }

      setSavedMessage('Schemat sparades!');
      onSaved?.();
      setTimeout(() => setSavedMessage(''), 2500);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Kunde inte spara schemat');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-slate-600 text-sm py-4">Laddar schema...</div>;
  }

  return (
    <div className="space-y-3">
      {/* PRESETS */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Mallar</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-left p-2.5 bg-white border border-slate-200 rounded-md hover:border-slate-900 hover:shadow-sm transition-all"
            >
              <p className="text-sm font-medium text-slate-900">{preset.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      {savedMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
          {savedMessage}
        </div>
      )}

      <div className="space-y-2">
        {schedule.map(day => (
          <div key={day.day_of_week}
            className={`rounded-lg border ${day.enabled ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50'}`}
          >
            <div className="flex items-center justify-between p-3 sm:p-4">
              <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={() => toggleDay(day.day_of_week)}
                  className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="font-medium text-slate-900">
                  <span className="hidden sm:inline">{DAY_LABELS[day.day_of_week]}</span>
                  <span className="sm:hidden">{DAY_SHORT[day.day_of_week]}</span>
                </span>
                {!day.enabled && <span className="text-xs text-slate-500">Ledig</span>}
              </label>

              {day.enabled && (
                <div className="flex items-center gap-1">
                  <CopyMenu
                    day={day.day_of_week}
                    onCopyAll={() => copyDayToAll(day.day_of_week)}
                    onCopyWeekdays={() => copyDayToWeekdays(day.day_of_week)}
                  />
                  <button
                    type="button"
                    onClick={() => addShift(day.day_of_week)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Pass</span>
                  </button>
                </div>
              )}
            </div>

            {day.enabled && (
              <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2">
                {day.shifts.map((shift, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input
                      type="time"
                      value={shift.start_time}
                      onChange={e => updateShift(day.day_of_week, idx, 'start_time', e.target.value)}
                      className="px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent w-full max-w-[110px]"
                    />
                    <span className="text-slate-500 text-sm">–</span>
                    <input
                      type="time"
                      value={shift.end_time}
                      onChange={e => updateShift(day.day_of_week, idx, 'end_time', e.target.value)}
                      className="px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent w-full max-w-[110px]"
                    />
                    {day.shifts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeShift(day.day_of_week, idx)}
                        className="ml-auto p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        aria-label="Ta bort pass"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {!embedded && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? 'Sparar...' : 'Spara schema'}
          </button>
        </div>
      )}
    </div>
  );
}

function CopyMenu({
  day, onCopyAll, onCopyWeekdays,
}: {
  day: number; onCopyAll: () => void; onCopyWeekdays: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
      >
        <Copy className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Kopiera</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 py-1 min-w-[180px]">
          <button
            type="button"
            onClick={() => { onCopyWeekdays(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Till vardagar
          </button>
          <button
            type="button"
            onClick={() => { onCopyAll(); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Till alla dagar
          </button>
        </div>
      )}
    </div>
  );
}

export type { DaySchedule, Shift };