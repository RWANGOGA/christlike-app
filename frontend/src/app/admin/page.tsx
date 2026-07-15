'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { Sunrise, Mic, ShieldAlert, Video, Lightbulb, Heart, Users, Menu } from 'lucide-react';

export default function AdminDashboard() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [tab, setTab] = useState<'devotions' | 'series' | 'sermons' | 'facts' | 'prayers' | 'users'>('devotions');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const [devotions, setDevotions] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [sermons, setSermons] = useState<any[]>([]);
  const [facts, setFacts] = useState<any[]>([]);
  const [prayers, setPrayers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userCount, setUserCount] = useState(0);

  const [devForm, setDevForm] = useState({ title: '', date: '', bible_reference: '', content: '', author: '', is_published: true });
  const [seriesForm, setSeriesForm] = useState({ title: '', description: '', speaker_name: '', thumbnail_url: '' });
  const [sermonForm, setSermonForm] = useState({ title: '', description: '', speaker_name: '', video_url: '', bible_passage: '' });
  const [factForm, setFactForm] = useState({ title: '', category: '', content: '', bible_reference: '', difficulty_level: 'Beginner' });
  
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Check Admin Status & Load Data
  useEffect(() => {
    const check = async () => {
      try {
        const user = await api.get('/users/me');
        if (!user.is_admin) { router.replace('/dashboard'); return; }
        setAllowed(true);
        loadData();
      } catch { 
        router.replace('/'); 
      } finally { 
        setChecking(false); 
      }
    };
    check();
  }, [router]);

  // 2. Load All Data
  const loadData = async () => {
    try {
      const [devs, ser, sermonsData, factsData, prayersData, usersData] = await Promise.all([
        api.get('/devotions').catch(() => []),
        api.get('/series').catch(() => []),
        api.get('/sermons').catch(() => []),
        api.get('/facts').catch(() => []),
        api.get('/prayers').catch(() => []),
        api.get('/users').catch(() => [])
      ]);
      setDevotions(devs || []);
      setSeries(ser || []);
      setSermons(sermonsData || []);
      setFacts(factsData || []);
      setPrayers(prayersData || []);
      setUsers(usersData || []);
      setUserCount(usersData?.length || 0);
    } catch (err) {
      console.error("Failed to load admin data", err);
    }
  };

  // 3. Submit Handlers (This is what was missing!)
  const submitDevotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setMessage('');
    try {
      await api.post('/devotions', devForm);
      setMessage('Devotion created successfully!');
      setDevForm({ title: '', date: '', bible_reference: '', content: '', author: '', is_published: true });
      loadData();
    } catch { setMessage('Failed to create devotion.'); } 
    finally { setSubmitting(false); }
  };

  const submitSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setMessage('');
    try {
      await api.post('/series', seriesForm);
      setMessage('Series created successfully!');
      setSeriesForm({ title: '', description: '', speaker_name: '', thumbnail_url: '' });
      loadData();
    } catch { setMessage('Failed to create series.'); } 
    finally { setSubmitting(false); }
  };

  const submitSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setMessage('');
    try {
      await api.post('/sermons', sermonForm);
      setMessage('Sermon created successfully!');
      setSermonForm({ title: '', description: '', speaker_name: '', video_url: '', bible_passage: '' });
      loadData();
    } catch { setMessage('Failed to create sermon.'); } 
    finally { setSubmitting(false); }
  };

  const submitFact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setMessage('');
    try {
      await api.post('/facts', factForm);
      setMessage('Fact created successfully!');
      setFactForm({ title: '', category: '', content: '', bible_reference: '', difficulty_level: 'Beginner' });
      loadData();
    } catch { setMessage('Failed to create fact.'); } 
    finally { setSubmitting(false); }
  };

  const handleImpersonate = (userId: number) => {
    alert(`Impersonating user ${userId} (Feature coming soon)`);
  };

  if (checking) return (
    <div className="flex items-center justify-center min-h-screen bg-[#FBF7EE]">
      <div className="w-8 h-8 border-2 border-[#23213A]/20 border-t-[#23213A] rounded-full animate-spin" />
    </div>
  );

  if (!allowed) return null;

  return (
    <div className="flex bg-[#FBF7EE] min-h-screen">
      {/* Sidebar with mobile support */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#23213A]/10 transform transition-transform duration-300 md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 md:ml-64 transition-all duration-300">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 bg-[#FBF7EE] border-b border-[#23213A]/10 md:hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-[#E3A857]" strokeWidth={1.5} />
              <h1 className="font-[family-name:var(--font-display)] text-xl text-[#23213A]">Admin</h1>
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-[#23213A]/5">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {/* Desktop Header */}
          <header className="hidden md:flex items-center gap-3 mb-8">
            <ShieldAlert className="w-6 h-6 text-[#E3A857]" strokeWidth={1.5} />
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#23213A]">Admin Dashboard</h1>
              <p className="text-[#23213A]/50">Manage content and community.</p>
            </div>
          </header>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-[#23213A]/10 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
            {(['devotions', 'series', 'sermons', 'facts', 'prayers', 'users'] as const).map((t) => (
              <button 
                key={t}
                onClick={() => setTab(t)} 
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap snap-start capitalize ${tab === t ? 'border-[#E3A857] text-[#23213A]' : 'border-transparent text-[#23213A]/60'}`}
              >
                {t === 'devotions' && <Sunrise className="w-4 h-4" />}
                {t === 'series' && <Mic className="w-4 h-4" />}
                {t === 'sermons' && <Video className="w-4 h-4" />}
                {t === 'facts' && <Lightbulb className="w-4 h-4" />}
                {t === 'prayers' && <Heart className="w-4 h-4" />}
                {t === 'users' && <Users className="w-4 h-4" />}
                {t} {t === 'users' && `(${userCount})`}
              </button>
            ))}
          </div>

          {message && (
            <p className="text-sm text-[#23213A]/70 bg-[#E3A857]/10 border border-[#E3A857]/20 rounded-xl px-4 py-3 mb-6">
              {message}
            </p>
          )}

          {/* DEVOTIONS TAB */}
          {tab === 'devotions' && (
            <>
              <form onSubmit={submitDevotion} className="bg-white p-5 md:p-6 rounded-2xl border border-[#23213A]/10 mb-8 space-y-5">
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#23213A]">New Devotion</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required placeholder="Title" value={devForm.title} onChange={(e) => setDevForm({ ...devForm, title: e.target.value })} className="px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm" />
                  <input required type="date" value={devForm.date} onChange={(e) => setDevForm({ ...devForm, date: e.target.value })} className="px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm" />
                  <input required placeholder="Bible reference" value={devForm.bible_reference} onChange={(e) => setDevForm({ ...devForm, bible_reference: e.target.value })} className="px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm md:col-span-2" />
                  <input required placeholder="Author" value={devForm.author} onChange={(e) => setDevForm({ ...devForm, author: e.target.value })} className="px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm" />
                </div>
                <textarea required placeholder="Content" value={devForm.content} onChange={(e) => setDevForm({ ...devForm, content: e.target.value })} rows={6} className="w-full px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm" />
                <button type="submit" disabled={submitting} className="w-full md:w-auto px-8 py-3 rounded-xl bg-[#23213A] text-[#FBF7EE] font-medium disabled:opacity-50">
                  {submitting ? 'Publishing…' : 'Create Devotion'}
                </button>
              </form>
              <div className="bg-white rounded-2xl border border-[#23213A]/10 overflow-hidden">
                {devotions.map((d: any) => (
                  <div key={d.id} className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#23213A]/5 last:border-0 gap-3">
                    <div>
                      <p className="font-medium text-[#23213A]">{d.title}</p>
                      <p className="text-sm text-[#23213A]/50">{d.bible_reference}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* SERIES TAB */}
          {tab === 'series' && (
            <form onSubmit={submitSeries} className="bg-white p-5 md:p-6 rounded-2xl border border-[#23213A]/10 space-y-5">
              <h2 className="font-[family-name:var(--font-display)] text-xl text-[#23213A]">New Series</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Title" value={seriesForm.title} onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })} className="px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm" />
                <input required placeholder="Speaker Name" value={seriesForm.speaker_name} onChange={(e) => setSeriesForm({ ...seriesForm, speaker_name: e.target.value })} className="px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm" />
                <input required placeholder="Thumbnail URL" value={seriesForm.thumbnail_url} onChange={(e) => setSeriesForm({ ...seriesForm, thumbnail_url: e.target.value })} className="px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm md:col-span-2" />
              </div>
              <textarea required placeholder="Description" value={seriesForm.description} onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })} rows={4} className="w-full px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm" />
              <button type="submit" disabled={submitting} className="w-full md:w-auto px-8 py-3 rounded-xl bg-[#23213A] text-[#FBF7EE] font-medium disabled:opacity-50">
                {submitting ? 'Publishing…' : 'Create Series'}
              </button>
            </form>
          )}

          {/* SERMONS TAB */}
          {tab === 'sermons' && (
            <form onSubmit={submitSermon} className="bg-white p-5 md:p-6 rounded-2xl border border-[#23213A]/10 space-y-5">
              <h2 className="font-[family-name:var(--font-display)] text-xl text-[#23213A]">New Sermon</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Title" value={sermonForm.title} onChange={(e) => setSermonForm({ ...sermonForm, title: e.target.value })} className="px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm" />
                <input required placeholder="Speaker Name" value={sermonForm.speaker_name} onChange={(e) => setSermonForm({ ...sermonForm, speaker_name: e.target.value })} className="px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm" />
                <input required placeholder="Video URL" value={sermonForm.video_url} onChange={(e) => setSermonForm({ ...sermonForm, video_url: e.target.value })} className="px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm md:col-span-2" />
                <input required placeholder="Bible Passage" value={sermonForm.bible_passage} onChange={(e) => setSermonForm({ ...sermonForm, bible_passage: e.target.value })} className="px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm md:col-span-2" />
              </div>
              <textarea required placeholder="Description" value={sermonForm.description} onChange={(e) => setSermonForm({ ...sermonForm, description: e.target.value })} rows={4} className="w-full px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm" />
              <button type="submit" disabled={submitting} className="w-full md:w-auto px-8 py-3 rounded-xl bg-[#23213A] text-[#FBF7EE] font-medium disabled:opacity-50">
                {submitting ? 'Publishing…' : 'Create Sermon'}
              </button>
            </form>
          )}

          {/* FACTS TAB */}
          {tab === 'facts' && (
            <form onSubmit={submitFact} className="bg-white p-5 md:p-6 rounded-2xl border border-[#23213A]/10 space-y-5">
              <h2 className="font-[family-name:var(--font-display)] text-xl text-[#23213A]">New Bible Fact</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Title" value={factForm.title} onChange={(e) => setFactForm({ ...factForm, title: e.target.value })} className="px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm" />
                <input required placeholder="Category" value={factForm.category} onChange={(e) => setFactForm({ ...factForm, category: e.target.value })} className="px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm" />
                <input required placeholder="Bible Reference" value={factForm.bible_reference} onChange={(e) => setFactForm({ ...factForm, bible_reference: e.target.value })} className="px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm md:col-span-2" />
              </div>
              <textarea required placeholder="Content" value={factForm.content} onChange={(e) => setFactForm({ ...factForm, content: e.target.value })} rows={4} className="w-full px-4 py-3 rounded-xl border border-[#23213A]/15 text-sm" />
              <button type="submit" disabled={submitting} className="w-full md:w-auto px-8 py-3 rounded-xl bg-[#23213A] text-[#FBF7EE] font-medium disabled:opacity-50">
                {submitting ? 'Publishing…' : 'Create Fact'}
              </button>
            </form>
          )}

          {/* USERS TAB */}
          {tab === 'users' && (
            <div className="bg-white rounded-2xl border border-[#23213A]/10 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-[#23213A]/5 bg-[#FBF7EE] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="font-semibold text-[#23213A]">Registered Users</h3>
                <span className="text-sm text-[#23213A]/60">Total: {userCount}</span>
              </div>
              <ul className="divide-y divide-[#23213A]/5">
                {users.map((u: any) => (
                  <li key={u.id} className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FBF7EE]">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#23213A] truncate">
                        {u.username}
                        {u.is_admin && <span className="text-xs bg-[#E3A857]/20 text-[#E3A857] px-2.5 py-1 rounded-full ml-2">Admin</span>}
                      </p>
                      <p className="text-sm text-[#23213A]/50 mt-1 break-all">
                        {u.email} • {u.faith_journey_stage || 'No stage'} • Streak: {u.streak_count || 0}
                      </p>
                    </div>
                    {!u.is_admin && (
                      <button 
                        onClick={() => handleImpersonate(u.id)}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#23213A] text-[#FBF7EE] text-sm font-medium hover:bg-[#171B33] transition"
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

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}