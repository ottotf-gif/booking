import { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, FileText, Tag, Plus, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function ProfileView() {
  const { profile, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
  });
  const [bio, setBio] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newSpecialization, setNewSpecialization] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const isStylist = profile?.role === 'stylist';

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        phone: profile.phone || '',
        email: profile.email,
      });
    }
    if (isStylist && profile) {
      loadStylistInfo(profile.id);
    }
  }, [profile, isStylist]);

  const loadStylistInfo = async (stylistId: string) => {
    const { data, error } = await supabase
      .from('stylists')
      .select('bio, specializations')
      .eq('id', stylistId)
      .maybeSingle();

    if (error) {
      console.error('Error loading stylist info:', error);
      return;
    }

    if (data) {
      setBio(data.bio || '');
      setSpecializations(data.specializations || []);
    }
  };

  const addSpecialization = () => {
    const trimmed = newSpecialization.trim();
    if (trimmed && !specializations.includes(trimmed)) {
      setSpecializations([...specializations, trimmed]);
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (spec: string) => {
    setSpecializations(specializations.filter((s) => s !== spec));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone || null,
      });

      if (isStylist && profile) {
        const { error: stylistError } = await supabase
          .from('stylists')
          .update({
            bio: bio || null,
            specializations,
          })
          .eq('id', profile.id);

        if (stylistError) throw stylistError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Profile Settings</h1>
      <p className="text-slate-600 mb-8">Manage your personal information</p>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          Profile updated successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{profile.full_name}</h2>
            <p className="text-slate-600 capitalize">{profile.role}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-slate-400" />
              </div>
              <input
                id="email"
                type="email"
                value={formData.email}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed"
                disabled
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="w-5 h-5 text-slate-400" />
              </div>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="+46 70 123 45 67"
              />
            </div>
          </div>

          {isStylist && (
            <>
              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Barber Information</h3>
                <p className="text-sm text-slate-500 mb-4">
                  This is shown to customers when they pick a barber.
                </p>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-2">
                  Bio
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Tell customers about your experience and style..."
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Specializations
                </label>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={newSpecialization}
                      onChange={(e) => setNewSpecialization(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSpecialization();
                        }
                      }}
                      placeholder="e.g. Fades, Beard trimming"
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addSpecialization}
                    className="px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                {specializations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {specializations.map((spec) => (
                      <span
                        key={spec}
                        className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-slate-100 text-slate-800 text-sm font-medium rounded-full"
                      >
                        {spec}
                        <button
                          type="button"
                          onClick={() => removeSpecialization(spec)}
                          className="p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                          aria-label={`Remove ${spec}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
