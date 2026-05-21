import { useState, useEffect } from 'react';
import { UserPlus, Users, Trash2, XCircle, CheckCircle, Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { ConfirmationModal, type ConfirmationType } from '../common/ConfirmationModal';
import { BarberScheduleEditor, DEFAULT_SCHEDULE, type DaySchedule } from './BarberScheduleEditor';
import { TimeOffManager } from './TimeOffManager';

type Stylist = Database['public']['Tables']['stylists']['Row'] & {
  profile: Database['public']['Tables']['profiles']['Row'];
};

type FilterType = 'all' | 'active' | 'inactive';

interface ConfirmationState {
  isOpen: boolean;
  type: ConfirmationType;
  stylistId: string | null;
  stylistName: string;
  currentStatus: boolean;
}

export function StaffManagement() {
  const [staff, setStaff] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editScheduleFor, setEditScheduleFor] = useState<Stylist | null>(null);
  const [filter, setFilter] = useState<FilterType>('active');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    type: 'deactivate',
    stylistId: null,
    stylistName: '',
    currentStatus: true,
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('stylists')
        .select(`*, profile:profiles(*)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff((data as any) || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConfirmation = (
    type: ConfirmationType,
    stylistId: string,
    stylistName: string,
    currentStatus: boolean
  ) => {
    setConfirmation({ isOpen: true, type, stylistId, stylistName, currentStatus });
  };

  const closeConfirmation = () => {
    setConfirmation({ isOpen: false, type: 'deactivate', stylistId: null, stylistName: '', currentStatus: true });
  };

  const handleToggleActive = async () => {
    if (!confirmation.stylistId) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('stylists')
        .update({ active: !confirmation.currentStatus })
        .eq('id', confirmation.stylistId);
      if (error) throw error;
      await loadStaff();
      closeConfirmation();
    } catch (error: any) {
      alert(error.message || 'Failed to update staff status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmation.stylistId) return;
    setIsProcessing(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', confirmation.stylistId);
      if (profileError) throw profileError;
      await loadStaff();
      closeConfirmation();
    } catch (error: any) {
      alert(error.message || 'Failed to delete staff member');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (confirmation.type === 'delete') handleDelete();
    else handleToggleActive();
  };

  const filteredStaff = staff.filter((member) => {
    if (filter === 'active') return member.active;
    if (filter === 'inactive') return !member.active;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Laddar personal...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Personal</h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">Hantera barbers och deras scheman</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
        >
          <UserPlus className="w-5 h-5" />
          Lägg till barber
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 mb-6 overflow-x-auto pb-1">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Filter className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700 hidden sm:inline">Visa:</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              filter === 'active' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Aktiva ({staff.filter((s) => s.active).length})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              filter === 'inactive' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Inaktiva ({staff.filter((s) => !s.active).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Alla ({staff.length})
          </button>
        </div>
      </div>

      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 text-center">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {staff.length === 0 ? 'Inga anställda än' : `Inga ${filter === 'active' ? 'aktiva' : 'inaktiva'} barbers`}
          </h3>
          <p className="text-slate-600 mb-4">
            {staff.length === 0 ? 'Lägg till din första barber för att komma igång' : ''}
          </p>
          {staff.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Lägg till första barbern
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredStaff.map((member) => (
            <div key={member.id} className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {member.profile.avatar_url ? (
                    <img
                      src={member.profile.avatar_url}
                      alt={member.profile.full_name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-slate-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{member.profile.full_name}</h3>
                    <p className="text-sm text-slate-600 truncate">{member.profile.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ml-2 ${
                  member.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {member.active ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>

              {member.bio && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{member.bio}</p>
              )}

              {member.specializations.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {member.specializations.slice(0, 3).map((spec, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded">{spec}</span>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                <button
                  onClick={() => setEditScheduleFor(member)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <CalendarIcon className="w-4 h-4" />
                  Schema
                </button>
                {member.active ? (
                  <button
                    onClick={() => openConfirmation('deactivate', member.id, member.profile.full_name, member.active)}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                    aria-label="Inaktivera"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => openConfirmation('reactivate', member.id, member.profile.full_name, member.active)}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    aria-label="Aktivera"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => openConfirmation('delete', member.id, member.profile.full_name, member.active)}
                  className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  aria-label="Ta bort"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddStaffModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); loadStaff(); }}
        />
      )}

      {editScheduleFor && (
        <ScheduleModal
          stylist={editScheduleFor}
          onClose={() => setEditScheduleFor(null)}
        />
      )}

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        type={confirmation.type}
        title={
          confirmation.type === 'delete' ? 'Ta bort barber'
            : confirmation.type === 'deactivate' ? 'Inaktivera barber'
            : 'Återaktivera barber'
        }
        message={
          confirmation.type === 'delete' ? 'Är du säker på att du vill ta bort den här barbern permanent?'
            : confirmation.type === 'deactivate' ? 'Är du säker på att du vill inaktivera den här barbern?'
            : 'Är du säker på att du vill återaktivera den här barbern?'
        }
        itemName={confirmation.stylistName}
        onConfirm={handleConfirm}
        onCancel={closeConfirmation}
        isProcessing={isProcessing}
      />
    </div>
  );
}

// ============================================================================
// Edit Schedule Modal
// ============================================================================
function ScheduleModal({ stylist, onClose }: { stylist: Stylist; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Schema</h2>
            <p className="text-sm text-slate-600">{stylist.profile.full_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Stäng">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Arbetstider per vecka</h3>
            <BarberScheduleEditor stylistId={stylist.id} onSaved={() => {}} />
          </div>
          <div className="pt-4 border-t border-slate-200">
            <TimeOffManager stylistId={stylist.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Add Staff Modal — now includes schedule editor inline
// ============================================================================
interface AddStaffModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddStaffModal({ onClose, onSuccess }: AddStaffModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    bio: '',
    specializations: '',
    instagram_handle: '',
    avatar_url: '',
  });
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    if (!phoneNumber) return true;
    const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('+')) return /^\+\d{8,15}$/.test(cleaned);
    return /^\d{7,15}$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      setError('Ange ett giltigt telefonnummer.');
      return;
    }

    setSaving(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.full_name } },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Inget konto skapades');

      const userId = authData.user.id;

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: formData.email,
            full_name: formData.full_name,
            phone: formData.phone || null,
            avatar_url: formData.avatar_url || null,
            role: 'stylist',
          });
        if (profileError) throw profileError;
      } else {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone || null,
            avatar_url: formData.avatar_url || null,
            role: 'stylist',
          })
          .eq('id', userId);
        if (profileUpdateError) throw profileUpdateError;
      }

      const specializations = formData.specializations
        .split(',').map(s => s.trim()).filter(s => s.length > 0);

      // Try with instagram_handle (after migration). Fall back if column missing.
      const stylistRow: any = {
        id: userId,
        bio: formData.bio || null,
        specializations,
        active: true,
      };
      if (formData.instagram_handle) stylistRow.instagram_handle = formData.instagram_handle;

      let { error: stylistError } = await supabase.from('stylists').insert(stylistRow);
      if (stylistError && /instagram_handle/.test(stylistError.message)) {
        delete stylistRow.instagram_handle;
        ({ error: stylistError } = await supabase.from('stylists').insert(stylistRow));
      }
      if (stylistError) throw stylistError;

      // Assign all active services
      const { data: services } = await supabase.from('services').select('id').eq('active', true);
      if (services && services.length > 0) {
        const stylistServices = services.map((s) => ({ stylist_id: userId, service_id: s.id }));
        await supabase.from('stylist_services').insert(stylistServices);
      }

      // Insert chosen schedule
      const availabilityRows = schedule.flatMap(d =>
        d.enabled
          ? d.shifts.map(s => ({
              stylist_id: userId,
              day_of_week: d.day_of_week,
              start_time: s.start_time,
              end_time: s.end_time,
              is_available: true,
            }))
          : [{
              stylist_id: userId,
              day_of_week: d.day_of_week,
              start_time: '00:00',
              end_time: '00:00',
              is_available: false,
            }]
      );
      if (availabilityRows.length > 0) {
        await supabase.from('stylist_availability').insert(availabilityRows);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error adding staff:', err);
      setError(err.message || 'Kunde inte lägga till barbern');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Ny barber</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Stäng">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fullständigt namn *</label>
              <input type="text" value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-post *</label>
              <input type="email" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lösenord *</label>
              <input type="password" value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                required minLength={6}
              />
              <p className="text-xs text-slate-500 mt-1">Minst 6 tecken</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <input type="tel" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+46 70 123 45 67"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
            <textarea value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              rows={2}
              placeholder="Kort beskrivning av erfarenhet..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Specialiteter</label>
            <input type="text" value={formData.specializations}
              onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="t.ex. Klippning, Skäggtrim, Fade"
            />
            <p className="text-xs text-slate-500 mt-1">Separera med kommatecken</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Profilbild (URL)</label>
              <input type="url" value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Instagram-användarnamn</label>
              <input type="text" value={formData.instagram_handle}
                onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value.replace(/^@/, '') })}
                placeholder="t.ex. yourbarber"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">Arbetstider</h3>
            <p className="text-xs text-slate-500 mb-3">
              Välj vilka dagar barbern jobbar och vilka tider. Lägg till flera pass per dag för lunchpaus.
            </p>
            <BarberScheduleEditor
              stylistId=""
              embedded
              initialSchedule={schedule}
              onChange={setSchedule}
            />
          </div>
        </form>

        <div className="flex gap-3 p-4 sm:p-6 border-t border-slate-200 bg-slate-50">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition-colors font-medium"
          >
            Avbryt
          </button>
          <button type="submit" onClick={handleSubmit} disabled={saving}
            className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? 'Lägger till...' : 'Lägg till barber'}
          </button>
        </div>
      </div>
    </div>
  );
}