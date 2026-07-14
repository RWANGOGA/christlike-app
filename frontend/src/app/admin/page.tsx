'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { Sunrise, Mic, ShieldAlert, Video, Lightbulb, Heart, CheckCircle, Trash2, Users } from 'lucide-react';

export default function AdminDashboard() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [tab, setTab] = useState<'devotions' | 'series' | 'sermons' | 'facts' | 'prayers' | 'users'>('devotions');
  const router = useRouter();

  const [devotions, setDevotions] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [sermons, setSermons] = useState<any[]>([]);
  const [facts, setFacts] = useState<any[]>([]);
  const [prayers, setPrayers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loadingList, setLoadingList] = useState(false);

  const [devForm, setDevForm] = useState({ title: '', date: '', bible_reference: '', content: '', author: '', is_published: true });
  const [seriesForm, setSeriesForm] = useState({ title: '', description: '', speaker_name: '', thumbnail_url: '' });
  const [sermonForm, setSermonForm] = useState({ title: '', description: '', speaker_name: '', video_url: '', bible_passage: '' });
  const [factForm, setFactForm] = useState({ title: '', category: '', content: '', bible_reference: '', difficulty_level: 'Beginner' });
  
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const check = async () => {
      try {
        const user = await api.get('/users/me');
        if (!user.is_admin) { router.replace('/dashboard'); return; }
        setAllowed(true);
      } catch { router.replace('/'); } finally { setChecking(false); }
    };
    check();
  }, [router]);

  const loadDevotions = async () => { setLoadingList(true); try { setDevotions(await api.get('/api/admin/devotions')); } finally { setLoadingList(false); } };
  const loadSeries = async () => { setLoadingList(true); try { setSeries(await api.get('/api/admin/sermon-series')); } finally { setLoadingList(false); } };
  const loadSermons = async () => { if (!selectedSeriesId) return; setLoadingList(true); try { setSermons(await api.get(`/api/sermon-series/${selectedSeriesId}/sermons`)); } finally { setLoadingList(false); } };
  const loadFacts = async () => { setLoadingList(true); try { setFacts(await api.get('/api/facts')); } finally { setLoadingList(false); } };
  const loadPrayers = async () => { setLoadingList(true); try { setPrayers(await api.get('/api/admin/prayer-requests')); } finally { setLoadingList(false); } };
  const loadUsers = async () => { setLoadingList(true); try { const data = await api.get('/api/admin/users'); setUserCount(data.total_count); setUsers(data.users); } finally { setLoadingList(false); } };

  useEffect(() => {
    if (!allowed) return;
    if (tab === 'devotions') loadDevotions();
    else if (tab === 'series') loadSeries();
    else if (tab === 'sermons' && selectedSeriesId) loadSermons();
    else if (tab === 'facts') loadFacts();
    else if (tab === 'prayers') loadPrayers();
    else if (tab === 'users') loadUsers();
  }, [allowed, tab, selectedSeriesId]);

  const submitDevotion = async (e: React.FormEvent) => { e.preventDefault(); setSubmitting(true); setMessage(''); try { await api.post('/api/admin/devotions', devForm); setMessage('Devotion published.'); setDevForm({ title: '', date: '', bible_reference: '', content: '', author: '', is_published: true }); loadDevotions(); } catch (err: any) { setMessage(err.message); } finally { setSubmitting(false); } };
  const submitSeries = async (e: React.FormEvent) => { e.preventDefault(); setSubmitting(true); setMessage(''); try { await api.post('/api/admin/sermon-series', seriesForm); setMessage('Series created.'); setSeriesForm({ title: '', description: '', speaker_name: '', thumbnail_url: '' }); loadSeries(); } catch (err: any) { setMessage(err.message); } finally { setSubmitting(false); } };
  const submitSermon = async (e: React.FormEvent) => { e.preventDefault(); if (!selectedSeriesId) return; setSubmitting(true); setMessage(''); try { await api.post(`/api/admin/sermon-series/${selectedSeriesId}/sermons`, sermonForm); setMessage('Sermon added.'); setSermonForm({ title: '', description: '', speaker_name: '', video_url: '', bible_passage: '' }); loadSermons(); } catch (err: any) { setMessage(err.message); } finally { setSubmitting(false); } };
  const submitFact = async (e: React.FormEvent) => { e.preventDefault(); setSubmitting(true); setMessage(''); try { await api.post('/api/admin/facts', factForm); setMessage('Fact published.'); setFactForm({ title: '', category: '', content: '', bible_reference: '', difficulty_level: 'Beginner' }); loadFacts(); } catch (err: any) { setMessage(err.message); } finally { setSubmitting(false); } };

  const resolvePrayer = async (id: number) => {
    try { await api.post(`/api/admin/prayer-requests/${id}/resolve`, {}); loadPrayers(); } catch (err: any) { setMessage(err.message); }
  };
  const deletePrayer = async (id: number) => {
    if(!confirm('Delete this prayer?')) return;
    try { 
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/prayer-requests/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      loadPrayers(); 
    } catch (err: any) { setMessage(err.message); }
  };

  // Magic Impersonation Function
  const handleImpersonate = async (userId: number) => {
    try {
      const data = await api.post(`/api/admin/impersonate/${userId}`, {});
      localStorage.setItem('token', data.access_token); // Overwrites admin token with user token
      window.location.href = '/dashboard'; // Redirects to their dashboard
    } catch (err: any) { 
      setMessage(err.message || 'Failed to switch user.'); 
    }
  };

  if (checking) return <div className="flex items-center justify-center min-h-screen bg-[#FBF7EE]"><div className="w-8 h-8 border-2 border-[#23213A]/20 border-t-[#23213A] rounded-full animate-spin" /></div>;
  if (!allowed) return null;

  return (
    <div className="flex bg-[#FBF7EE] min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 max-w-4xl">
        <header className="mb-8 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-[#E3A857]" strokeWidth={1.5} />
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#23213A]">Admin Dashboard</h1>
            <p className="text-[#23213A]/50 mt-1">Manage content and community.</p>
          </div>
        </header>

        <div className="flex gap-2 mb-8 border-b border-[#23213A]/10 overflow-x-auto pb-1">
          <button onClick={() => setTab('devotions')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === 'devotions' ? 'border-[#E3A857] text-[#23213A]' : 'border-transparent text-[#23213A]/50'}`}><Sunrise className="w-4 h-4" /> Devotions</button>
          <button onClick={() => setTab('series')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === 'series' ? 'border-[#E3A857] text-[#23213A]' : 'border-transparent text-[#23213A]/50'}`}><Mic className="w-4 h-4" /> Series</button>
          <button onClick={() => setTab('sermons')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === 'sermons' ? 'border-[#E3A857] text-[#23213A]' : 'border-transparent text-[#23213A]/50'}`}><Video className="w-4 h-4" /> Sermons</button>
          <button onClick={() => setTab('facts')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === 'facts' ? 'border-[#E3A857] text-[#23213A]' : 'border-transparent text-[#23213A]/50'}`}><Lightbulb className="w-4 h-4" /> Facts</button>
          <button onClick={() => setTab('prayers')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === 'prayers' ? 'border-[#E3A857] text-[#23213A]' : 'border-transparent text-[#23213A]/50'}`}><Heart className="w-4 h-4" /> Prayers</button>
          <button onClick={() => setTab('users')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === 'users' ? 'border-[#E3A857] text-[#23213A]' : 'border-transparent text-[#23213A]/50'}`}><Users className="w-4 h-4" /> Users ({userCount})</button>
        </div>

        {message && <p className="text-sm text-[#23213A]/70 bg-[#E3A857]/10 border border-[#E3A857]/20 rounded-lg px-4 py-2.5 mb-6">{message}</p>}

        {/* DEVOTIONS TAB */}
        {tab === 'devotions' && (
          <>
            <form onSubmit={submitDevotion} className="bg-white p-6 rounded-xl border border-[#23213A]/10 mb-8 space-y-4">
              <h2 className="font-[family-name:var(--font-display)] text-lg text-[#23213A]">New Devotion</h2>
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Title" value={devForm.title} onChange={(e) => setDevForm({ ...devForm, title: e.target.value })} className="px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
                <input required type="date" value={devForm.date} onChange={(e) => setDevForm({ ...devForm, date: e.target.value })} className="px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
                <input required placeholder="Bible reference" value={devForm.bible_reference} onChange={(e) => setDevForm({ ...devForm, bible_reference: e.target.value })} className="px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
                <input required placeholder="Author" value={devForm.author} onChange={(e) => setDevForm({ ...devForm, author: e.target.value })} className="px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
              </div>
              <textarea required placeholder="Content" value={devForm.content} onChange={(e) => setDevForm({ ...devForm, content: e.target.value })} rows={5} className="w-full px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
              <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-lg bg-[#23213A] text-[#FBF7EE] text-sm font-medium disabled:opacity-50">{submitting ? 'Publishing…' : 'Create'}</button>
            </form>
            <div className="bg-white rounded-xl border border-[#23213A]/10 overflow-hidden">
              {devotions.map((d) => (<li key={d.id} className="p-4 flex items-center justify-between list-none border-b border-[#23213A]/5 last:border-0"><div><p className="font-medium text-[#23213A]">{d.title}</p><p className="text-xs text-[#23213A]/50">{d.bible_reference}</p></div></li>))}
            </div>
          </>
        )}

        {/* SERIES TAB */}
        {tab === 'series' && (
          <>
            <form onSubmit={submitSeries} className="bg-white p-6 rounded-xl border border-[#23213A]/10 mb-8 space-y-4">
              <h2 className="font-[family-name:var(--font-display)] text-lg text-[#23213A]">New Series</h2>
              <input required placeholder="Title" value={seriesForm.title} onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
              <input required placeholder="Speaker" value={seriesForm.speaker_name} onChange={(e) => setSeriesForm({ ...seriesForm, speaker_name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
              <textarea required placeholder="Description" value={seriesForm.description} onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })} rows={3} className="w-full px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
              <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-lg bg-[#23213A] text-[#FBF7EE] text-sm font-medium disabled:opacity-50">{submitting ? 'Creating…' : 'Create'}</button>
            </form>
          </>
        )}

        {/* SERMONS TAB */}
        {tab === 'sermons' && (
          <>
            <div className="bg-white p-6 rounded-xl border border-[#23213A]/10 mb-8 space-y-4">
              <h2 className="font-[family-name:var(--font-display)] text-lg text-[#23213A]">Add Sermon</h2>
              <select value={selectedSeriesId || ''} onChange={(e) => setSelectedSeriesId(e.target.value ? Number(e.target.value) : null)} className="w-full px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm">
                <option value="">Select series...</option>
                {series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
              {selectedSeriesId && (
                <>
                  <input required placeholder="Title" value={sermonForm.title} onChange={(e) => setSermonForm({ ...sermonForm, title: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
                  <input required placeholder="YouTube URL" value={sermonForm.video_url} onChange={(e) => setSermonForm({ ...sermonForm, video_url: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
                  <button type="button" onClick={submitSermon} disabled={submitting} className="px-5 py-2.5 rounded-lg bg-[#23213A] text-[#FBF7EE] text-sm font-medium disabled:opacity-50">{submitting ? 'Adding…' : 'Add'}</button>
                </>
              )}
            </div>
          </>
        )}

        {/* FACTS TAB */}
        {tab === 'facts' && (
          <>
            <form onSubmit={submitFact} className="bg-white p-6 rounded-xl border border-[#23213A]/10 mb-8 space-y-4">
              <h2 className="font-[family-name:var(--font-display)] text-lg text-[#23213A]">New Fact</h2>
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Title" value={factForm.title} onChange={(e) => setFactForm({ ...factForm, title: e.target.value })} className="px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
                <input required placeholder="Category (e.g. Apologetics)" value={factForm.category} onChange={(e) => setFactForm({ ...factForm, category: e.target.value })} className="px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
                <input placeholder="Bible Reference" value={factForm.bible_reference} onChange={(e) => setFactForm({ ...factForm, bible_reference: e.target.value })} className="px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
                <select value={factForm.difficulty_level} onChange={(e) => setFactForm({ ...factForm, difficulty_level: e.target.value })} className="px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <textarea required placeholder="Content" value={factForm.content} onChange={(e) => setFactForm({ ...factForm, content: e.target.value })} rows={5} className="w-full px-3.5 py-2.5 rounded-lg border border-[#23213A]/15 text-sm" />
              <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-lg bg-[#23213A] text-[#FBF7EE] text-sm font-medium disabled:opacity-50">{submitting ? 'Publishing…' : 'Create Fact'}</button>
            </form>
          </>
        )}

        {/* PRAYERS TAB */}
        {tab === 'prayers' && (
          <div className="bg-white rounded-xl border border-[#23213A]/10 overflow-hidden">
            {prayers.map((p) => (
              <div key={p.id} className="p-4 border-b border-[#23213A]/5 last:border-0 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-[#23213A]/80">{p.content}</p>
                  <p className="text-xs text-[#23213A]/40 mt-2">{p.is_anonymous ? 'Anonymous' : 'User'} • {p.prayed_count} prayers • {new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  {!p.is_resolved && (
                    <button onClick={() => resolvePrayer(p.id)} className="p-2 rounded-lg bg-[#4A6355]/10 text-[#4A6355] hover:bg-[#4A6355]/20 transition" title="Mark as Answered">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => deletePrayer(p.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* USERS TAB (NEW!) */}
        {tab === 'users' && (
          <div className="bg-white rounded-xl border border-[#23213A]/10 overflow-hidden">
            <div className="p-4 border-b border-[#23213A]/5 bg-[#FBF7EE] flex justify-between items-center">
              <h3 className="font-semibold text-[#23213A]">Registered Users</h3>
              <span className="text-sm text-[#23213A]/60">Total: {userCount}</span>
            </div>
            <ul className="divide-y divide-[#23213A]/5">
              {users.map((u) => (
                <li key={u.id} className="p-4 flex items-center justify-between hover:bg-[#FBF7EE] transition">
                  <div>
                    <p className="font-medium text-[#23213A]">
                      {u.username} 
                      {u.is_admin && <span className="text-xs bg-[#E3A857]/20 text-[#E3A857] px-2 py-0.5 rounded-full ml-2">Admin</span>}
                    </p>
                    <p className="text-xs text-[#23213A]/50 mt-1">
                      {u.email} • {u.faith_journey_stage || 'No stage set'} • Streak: {u.streak_count || 0}
                    </p>
                  </div>
                  {!u.is_admin && (
                    <button 
                      onClick={() => handleImpersonate(u.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#23213A] text-[#FBF7EE] text-xs font-medium hover:bg-[#171B33] transition"
                    >
                      View as User
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}