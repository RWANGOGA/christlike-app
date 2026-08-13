'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Lock, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Get the token from the URL safely on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        setToken(urlToken);
      } else {
        setError('Invalid or missing reset token.');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // Call the backend endpoint to reset the password
      await api.post('/auth/reset-password', { token, new_password: newPassword });
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/?modal=login');
      }, 3000);
    } catch (err: any) {
      setError(err.detail || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (error && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5EFE6] px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-[#23213A] mb-4">Invalid Link</h1>
          <p className="text-[#23213A]/60 mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="px-6 py-2 bg-[#23213A] text-white rounded-full">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5EFE6] px-4 py-20">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl max-w-md w-full">
        
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#9CAF88]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#9CAF88]" />
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#23213A] mb-2">
              Password Reset!
            </h1>
            <p className="text-[#23213A]/60">
              Your password has been successfully updated. Redirecting you to login...
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-[#D4A5A5]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-[#D4A5A5]" />
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#23213A] mb-2">
                Create New Password
              </h1>
              <p className="text-sm text-[#23213A]/60">
                Enter your new password below.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-[#23213A]/70 mb-1.5">New Password</label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A5A5]/50"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#23213A]/70 mb-1.5">Confirm Password</label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A5A5]/50"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#23213A] text-[#FBF7EE] font-medium hover:bg-[#171B33] transition disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}