import { useState } from 'react';
import { User, Mail, Phone, Check } from 'lucide-react';

export interface GuestInfo {
  fullName: string;
  email: string;
  phone: string;
}

interface GuestBookingFlowProps {
  onGuestInfoSubmit: (guestInfo: GuestInfo) => void;
  onCancel: () => void;
}

export function GuestBookingFlow({ onGuestInfoSubmit, onCancel }: GuestBookingFlowProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+')) return /^\+\d{8,15}$/.test(cleaned);
    return /^\d{7,15}$/.test(cleaned);
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email && !phone) {
      setError('Please provide at least an email address or phone number');
      return;
    }

    if (phone && !validatePhoneNumber(phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      onGuestInfoSubmit({ fullName, email, phone });
    } catch (err: any) {
      setError(err.message || 'Failed to continue as guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Continue as Guest</h2>
          <p className="text-slate-600">We just need a few details to complete your booking</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleGuestSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
                required
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address <span className="text-slate-400 font-normal">(or phone below)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number <span className="text-slate-400 font-normal">(or email above)</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 flex items-center h-5">
                <Phone className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+46 70 123 45 67"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">
                <strong>Guest Booking:</strong> No account required. You only need to provide email or phone — whichever you prefer.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Continue to Booking'}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <button onClick={onCancel} className="text-slate-900 font-medium hover:underline">
              Sign in instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
