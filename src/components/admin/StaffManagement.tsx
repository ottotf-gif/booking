import { useState, useEffect } from 'react';
import { UserPlus, Users, Edit2, Trash2, XCircle, CheckCircle, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { ConfirmationModal, type ConfirmationType } from '../common/ConfirmationModal';

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
        .select(`
          *,
          profile:profiles(*)
        `)
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
    setConfirmation({
      isOpen: true,
      type,
      stylistId,
      stylistName,
      currentStatus,
    });
  };

  const closeConfirmation = () => {
    setConfirmation({
      isOpen: false,
      type: 'deactivate',
      stylistId: null,
      stylistName: '',
      currentStatus: true,
    });
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
    if (confirmation.type === 'delete') {
      handleDelete();
    } else {
      handleToggleActive();
    }
  };

  const filteredStaff = staff.filter((member) => {
    if (filter === 'active') return member.active;
    if (filter === 'inactive') return !member.active;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading staff...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-slate-600 mt-1">Manage barbers and their schedules</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Add Barber
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Filter:</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Active ({staff.filter((s) => s.active).length})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'inactive'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Inactive ({staff.filter((s) => !s.active).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({staff.length})
          </button>
        </div>
      </div>

      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {staff.length === 0 ? 'No staff members yet' : `No ${filter} staff members`}
          </h3>
          <p className="text-slate-600 mb-4">
            {staff.length === 0
              ? 'Add your first barber to get started'
              : `Try adjusting your filter to see ${filter === 'active' ? 'inactive' : 'active'} staff`}
          </p>
          {staff.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Add First Barber
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{member.profile.full_name}</h3>
                    <p className="text-sm text-slate-600">{member.profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      member.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {member.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {member.bio && (
                <p className="text-sm text-slate-600 mb-4">{member.bio}</p>
              )}

              {member.specializations.length > 0 && (
                <div className="mb-4">
                  <span className="text-xs text-slate-600">Specializations:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-200">
                {member.active ? (
                  <button
                    onClick={() =>
                      openConfirmation('deactivate', member.id, member.profile.full_name, member.active)
                    }
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      openConfirmation('reactivate', member.id, member.profile.full_name, member.active)
                    }
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Reactivate
                  </button>
                )}
                <button
                  onClick={() =>
                    openConfirmation('delete', member.id, member.profile.full_name, member.active)
                  }
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddStaffModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadStaff();
          }}
        />
      )}

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        type={confirmation.type}
        title={
          confirmation.type === 'delete'
            ? 'Delete Barber'
            : confirmation.type === 'deactivate'
            ? 'Deactivate Barber'
            : 'Reactivate Barber'
        }
        message={
          confirmation.type === 'delete'
            ? 'Are you sure you want to permanently delete this barber?'
            : confirmation.type === 'deactivate'
            ? 'Are you sure you want to deactivate this barber?'
            : 'Are you sure you want to reactivate this barber?'
        }
        itemName={confirmation.stylistName}
        onConfirm={handleConfirm}
        onCancel={closeConfirmation}
        isProcessing={isProcessing}
      />
    </div>
  );
}

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
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    if (!phoneNumber) return true;

    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

    if (cleaned.startsWith('+')) {
      return /^\+\d{8,15}$/.test(cleaned);
    }

    return /^\d{7,15}$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      setError('Please enter a valid phone number. International format: +46 70 123 45 67 or local format: 070 123 45 67');
      return;
    }

    setSaving(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user created');

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
            role: 'stylist',
          });

        if (profileError) throw profileError;
      } else {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone || null,
            role: 'stylist',
          })
          .eq('id', userId);

        if (profileUpdateError) throw profileUpdateError;
      }

      const specializations = formData.specializations
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const { error: stylistError } = await supabase
        .from('stylists')
        .insert({
          id: userId,
          bio: formData.bio || null,
          specializations: specializations,
          active: true,
        });

      if (stylistError) throw stylistError;

      const { data: services } = await supabase
        .from('services')
        .select('id')
        .eq('active', true);

      if (services && services.length > 0) {
        const stylistServices = services.map((service) => ({
          stylist_id: userId,
          service_id: service.id,
        }));

        await supabase.from('stylist_services').insert(stylistServices);
      }

      for (let day = 1; day <= 5; day++) {
        await supabase.from('stylist_availability').insert({
          stylist_id: userId,
          day_of_week: day,
          start_time: '09:00',
          end_time: '18:00',
          is_available: true,
        });
      }

      alert('Barber added successfully! They can now log in with their credentials.');
      onSuccess();
    } catch (err: any) {
      console.error('Error adding staff:', err);
      setError(err.message || 'Failed to add staff member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Add New Barber</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              required
              minLength={6}
            />
            <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+46 70 123 45 67"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">
              International format: +46 70 123 45 67 or local: 070 123 45 67
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              rows={3}
              placeholder="Brief description of experience..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Specializations
            </label>
            <input
              type="text"
              value={formData.specializations}
              onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="e.g., Haircuts, Beard Trimming, Coloring"
            />
            <p className="text-xs text-slate-500 mt-1">Separate multiple with commas</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-sm text-slate-700">
              <strong>Default Setup:</strong>
            </p>
            <ul className="text-sm text-slate-600 mt-1 space-y-1">
              <li>• All active services will be assigned</li>
              <li>• Mon-Fri availability: 9 AM - 6 PM</li>
              <li>• Account will be active immediately</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Barber'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
