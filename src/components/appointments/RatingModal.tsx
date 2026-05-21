import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RatingModalProps {
  appointmentId: string;
  stylistId: string;
  stylistName: string;
  customerId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function RatingModal({
  appointmentId, stylistId, stylistName, customerId, onClose, onSubmitted,
}: RatingModalProps) {
  const [salon, setSalon] = useState(0);
  const [barber, setBarber] = useState(0);
  const [comment, setComment] = useState('');
  const [hoverSalon, setHoverSalon] = useState(0);
  const [hoverBarber, setHoverBarber] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (salon === 0 || barber === 0) {
      setError('Sätt betyg på både salongen och barbern.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { error } = await supabase.from('appointment_ratings').insert({
        appointment_id: appointmentId,
        customer_id: customerId,
        stylist_id: stylistId,
        salon_rating: salon,
        barber_rating: barber,
        comment: comment.trim() || null,
      });
      if (error) throw error;
      onSubmitted();
    } catch (e: any) {
      setError(e.message || 'Kunde inte spara betyget');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-5 sm:p-6 max-h-[95vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Lämna betyg</h2>
            <p className="text-sm text-slate-600 mt-0.5">Hur var ditt besök?</p>
          </div>
          <button onClick={onClose} className="p-1.5 -m-1.5 hover:bg-slate-100 rounded-lg" aria-label="Stäng">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <StarRow
            label={`Barber – ${stylistName}`}
            value={barber}
            hover={hoverBarber}
            onChange={setBarber}
            onHover={setHoverBarber}
          />
          <StarRow
            label="Salongen i helhet"
            value={salon}
            hover={hoverSalon}
            onChange={setSalon}
            onHover={setHoverSalon}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Kommentar <span className="text-slate-400 font-normal">(valfri)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Berätta om ditt besök..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 font-medium"
          >
            {saving ? 'Sparar...' : 'Skicka betyg'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StarRow({
  label, value, hover, onChange, onHover,
}: {
  label: string;
  value: number;
  hover: number;
  onChange: (n: number) => void;
  onHover: (n: number) => void;
}) {
  const display = hover || value;
  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-2">{label}</p>
      <div className="flex items-center gap-1" onMouseLeave={() => onHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => onHover(n)}
            className="p-1 -m-1"
            aria-label={`${n} stjärnor`}
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                n <= display ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
              }`}
            />
          </button>
        ))}
        {value > 0 && <span className="ml-2 text-sm text-slate-600">{value}/5</span>}
      </div>
    </div>
  );
}