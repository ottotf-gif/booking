import { useState } from 'react';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function AdminSetup() {
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const createAdminAccount = async () => {
    setCreating(true);
    setError('');
    setSuccess(false);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: 'otto.tf@hotmail.com',
        password: 'Probarber',
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error('No user returned');

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: 'otto.tf@hotmail.com',
          full_name: 'Otto',
          role: 'admin',
        });

      if (profileError) throw profileError;

      setSuccess(true);
    } catch (err: any) {
      if (err.message?.includes('already registered')) {
        setError('Admin account already exists. Try updating the existing account role to admin.');
      } else {
        setError(err.message || 'Failed to create admin account');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-slate-900 p-3 rounded-xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">
          Admin Account Setup
        </h1>
        <p className="text-center text-slate-600 mb-8">
          Create the admin account for the barbershop system
        </p>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Admin account created successfully!</p>
                <p className="text-sm text-green-700 mt-1">
                  Email: otto.tf@hotmail.com<br />
                  Password: Probarber
                </p>
                <p className="text-sm text-green-700 mt-2">
                  You can now sign in with these credentials.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-slate-900 mb-2">Account Details</h3>
          <div className="space-y-1 text-sm text-slate-600">
            <p><strong>Email:</strong> otto.tf@hotmail.com</p>
            <p><strong>Password:</strong> Probarber</p>
            <p><strong>Role:</strong> Administrator</p>
          </div>
        </div>

        <button
          onClick={createAdminAccount}
          disabled={creating || success}
          className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? 'Creating Account...' : success ? 'Account Created' : 'Create Admin Account'}
        </button>

        {success && (
          <a
            href="/"
            className="block text-center mt-4 text-slate-600 hover:text-slate-900 text-sm"
          >
            Go to Login
          </a>
        )}
      </div>
    </div>
  );
}
