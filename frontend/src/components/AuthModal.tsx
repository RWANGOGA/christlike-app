'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { X } from 'lucide-react';

interface AuthModalProps {
  initialMode: 'login' | 'register';
  onSuccess: () => void;
  onClose: () => void;
}

export default function AuthModal({ initialMode, onSuccess, onClose }: AuthModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await api.register(email, username, password);
      }
      await api.login(email, password);

      const user = await api.get('/users/me');
      router.replace(user.is_admin ? '/admin' : '/dashboard');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#F5EFE6] transition"
        >
          <X className="w-5 h-5 text-[#5A4A4A]" />
        </button>

        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#5A4A4A] mb-6 text-center">
          {mode === 'login' ? 'Welcome Back' : 'Join Christ-Like'}
        </h2>

        {error && (
          <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#5A4A4A]/70 mb-1.5">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[#5A4A4A]/15 text-sm focus:outline-none focus:border-[#D4A5A5]"
                placeholder="Choose a username"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#5A4A4A]/70 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-[#5A4A4A]/15 text-sm focus:outline-none focus:border-[#D4A5A5]"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5A4A4A]/70 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-[#5A4A4A]/15 text-sm focus:outline-none focus:border-[#D4A5A5]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-[#D4A5A5] text-white font-semibold hover:bg-[#C99595] transition disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#5A4A4A]/60 mt-6">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-[#D4A5A5] font-medium hover:underline"
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}