'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Heart, Send } from 'lucide-react';
import { api } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function PrayerWall() {
  const [prayers, setPrayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // 👇 FIX: Track if we are still checking auth on the client
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get('/users/me');
        setIsAuthed(true);
      } catch {
        setIsAuthed(false);
      } finally {
        setCheckingAuth(false); // Done checking
      }
    };
    checkAuth();
  }, []);

  const fetchPrayers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prayer-requests`);
      if (res.ok) setPrayers(await res.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPrayers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/api/prayer-requests', { content, is_anonymous: isAnonymous });
      setContent('');
      setIsAnonymous(false);
      fetchPrayers();
    } catch (err: any) { 
      console.error(err); 
      alert(err.message || 'Failed to submit. Please ensure you are logged in.');
    } finally { 
      setSubmitting(false); 
    }
  };

  const handlePray = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/prayer-requests/${id}/pray`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPrayers(prayers.map(p => p.id === id ? { ...p, prayed_count: data.prayed_count } : p));
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex bg-[#FBF7EE] min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#23213A]">Prayer Wall</h1>
          <p className="text-[#23213A]/50 mt-1">Share your burdens and stand in agreement with others.</p>
        </header>

        {/* 👇 FIX: Show a loading state while checking auth to prevent hydration mismatch */}
        {checkingAuth ? (
          <div className="bg-white p-8 rounded-2xl border border-[#23213A]/10 shadow-sm mb-8 flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-[#23213A]/20 border-t-[#23213A] rounded-full animate-spin" />
          </div>
        ) : isAuthed ? (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-[#23213A]/10 shadow-sm mb-8">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your prayer request..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-[#23213A]/15 text-sm focus:outline-none focus:border-[#E3A857] resize-none"
              required
            />
            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center gap-2 text-sm text-[#23213A]/70 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isAnonymous} 
                  onChange={(e) => setIsAnonymous(e.target.checked)} 
                  className="rounded border-[#23213A]/20 text-[#E3A857] focus:ring-[#E3A857]"
                />
                Post anonymously
              </label>
              <button 
                type="submit" 
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#23213A] text-[#FBF7EE] text-sm font-medium hover:bg-[#171B33] transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> {submitting ? 'Sending...' : 'Submit Request'}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-[#23213A]/10 shadow-sm mb-8 text-center">
            <Heart className="w-10 h-10 text-[#E3A857]/40 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[#23213A]/70 mb-4">Please log in to share your prayer requests with the community.</p>
            <button 
              onClick={() => window.location.href = '/'} 
              className="px-6 py-2.5 rounded-lg bg-[#23213A] text-[#FBF7EE] text-sm font-medium hover:bg-[#171B33] transition"
            >
              Log In to Pray
            </button>
          </div>
        )}

        {/* Prayer Feed */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#23213A]/20 border-t-[#23213A] rounded-full animate-spin" />
          </div>
        ) : prayers.length > 0 ? (
          <div className="space-y-4">
            {prayers.map((p) => (
              <div key={p.id} className="bg-white p-6 rounded-2xl border border-[#23213A]/10 shadow-sm">
                <p className="text-[#23213A]/80 leading-relaxed mb-4">{p.content}</p>
                <div className="flex items-center justify-between pt-4 border-t border-[#23213A]/5">
                  <span className="text-xs text-[#23213A]/40">
                    {p.is_anonymous ? 'Anonymous' : 'User'} • {new Date(p.created_at).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => handlePray(p.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E3A857]/10 text-[#E3A857] hover:bg-[#E3A857]/20 transition text-sm font-medium"
                  >
                    <Heart className="w-4 h-4" fill="currentColor" />
                    <span>{p.prayed_count}</span>
                    <span className="hidden sm:inline">Prayed</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-[#23213A]/10 text-center">
            <Heart className="w-12 h-12 text-[#23213A]/20 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-[#23213A]/50">No prayer requests yet. Be the first to share.</p>
          </div>
        )}
      </div>
    </div>
  );
}