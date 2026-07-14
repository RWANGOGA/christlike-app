'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import { Calendar, BookOpen, X, CheckCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Devotion {
  id: number;
  title: string;
  date: string;
  bible_reference: string;
  content: string;
  author: string;
}

export default function DevotionsPage() {
  const [todayDevotion, setTodayDevotion] = useState<Devotion | null>(null);
  const [allDevotions, setAllDevotions] = useState<Devotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevotion, setSelectedDevotion] = useState<Devotion | null>(null);

  // NEW: track which devotion IDs the current user has completed
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  // NEW: anonymous "X people read this" count, keyed by devotion id
  const [devotionCounts, setDevotionCounts] = useState<Record<number, number>>({});
  const [markingId, setMarkingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const todayRes = await fetch(`${API_URL}/api/devotions/today`);
        if (todayRes.ok) setTodayDevotion(await todayRes.json());

        const allRes = await fetch(`${API_URL}/api/devotions`);
        if (allRes.ok) setAllDevotions(await allRes.json());

        // NEW: load which devotions this user already completed (if logged in)
        try {
          const completed = await api.get('/users/me/completed-devotions');
          setCompletedIds(completed.completed_ids || []);
        } catch (e) {
          // not logged in or request failed — just skip, page still works
        }
      } catch (err) {
        console.error("Failed to fetch devotions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // NEW: fetch the anonymous completion count for a devotion once, when opened
  const loadDevotionStats = async (devotionId: number) => {
    if (devotionCounts[devotionId] !== undefined) return; // already have it
    try {
      const res = await fetch(`${API_URL}/api/devotions/${devotionId}/stats`);
      if (res.ok) {
        const data = await res.json();
        setDevotionCounts((prev) => ({ ...prev, [devotionId]: data.completed_count }));
      }
    } catch (e) {
      // non-critical, ignore
    }
  };

  // NEW: mark a devotion as read
  const handleMarkAsRead = async (devotionId: number) => {
    setMarkingId(devotionId);
    try {
      await api.post(`/api/devotions/${devotionId}/complete`, {});
      setCompletedIds((prev) => (prev.includes(devotionId) ? prev : [...prev, devotionId]));
      // refresh the count since this user just added to it
      const res = await fetch(`${API_URL}/api/devotions/${devotionId}/stats`);
      if (res.ok) {
        const data = await res.json();
        setDevotionCounts((prev) => ({ ...prev, [devotionId]: data.completed_count }));
      }
    } catch (err) {
      console.error("Failed to mark devotion complete", err);
    } finally {
      setMarkingId(null);
    }
  };

  // Load stats for today's devotion once it's fetched
  useEffect(() => {
    if (todayDevotion) loadDevotionStats(todayDevotion.id);
  }, [todayDevotion]);

  // Load stats when a devotion is opened in the modal
  useEffect(() => {
    if (selectedDevotion) loadDevotionStats(selectedDevotion.id);
  }, [selectedDevotion]);

  return (
    <div className="flex bg-[#FBF7EE] min-h-screen">
      <Sidebar />
      {/* FIXED: was "ml-64 p-8" with no mobile breakpoint — now responsive like Dashboard */}
      <div className="flex-1 ml-0 md:ml-64 pt-20 md:pt-8 px-4 md:px-8 pb-8 max-w-5xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl text-[#23213A]">
            Daily Devotions
          </h1>
          <p className="text-[#23213A]/50 mt-1 text-sm md:text-base">Daily bread for your spiritual journey.</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#23213A]/20 border-t-[#23213A] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Today's Devotion Feature */}
            {todayDevotion && (
              <div className="bg-white p-6 md:p-12 rounded-2xl border border-[#23213A]/10 shadow-sm mb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#E3A857]/5 rounded-full -mr-32 -mt-32" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-[#E3A857] mb-4">
                    <Calendar className="w-4 h-4" strokeWidth={2} />
                    <span className="text-xs uppercase tracking-widest font-semibold">Today&apos;s Devotion</span>
                  </div>
                  <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl text-[#23213A] mb-2">
                    {todayDevotion.title}
                  </h2>
                  <p className="text-sm text-[#23213A]/50 mb-6">By {todayDevotion.author} • {todayDevotion.bible_reference}</p>
                  <div className="font-serif text-lg leading-relaxed text-[#23213A]/80 whitespace-pre-wrap">
                    {todayDevotion.content}
                  </div>

                  {/* NEW: Mark as Read + social proof count */}
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => handleMarkAsRead(todayDevotion.id)}
                      disabled={completedIds.includes(todayDevotion.id) || markingId === todayDevotion.id}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${
                        completedIds.includes(todayDevotion.id)
                          ? 'bg-[#4A6355]/10 text-[#4A6355] cursor-default'
                          : 'bg-[#23213A] text-[#FBF7EE] hover:bg-[#171B33]'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {completedIds.includes(todayDevotion.id)
                        ? 'Marked as Read'
                        : markingId === todayDevotion.id
                        ? 'Saving…'
                        : 'Mark as Read'}
                    </button>
                    {devotionCounts[todayDevotion.id] !== undefined && (
                      <span className="text-xs text-[#23213A]/50">
                        {devotionCounts[todayDevotion.id]} {devotionCounts[todayDevotion.id] === 1 ? 'person has' : 'people have'} read this
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Archive List */}
            <h3 className="font-[family-name:var(--font-display)] text-lg text-[#23213A] mb-4">
              Recent Devotions
            </h3>
            <div className="bg-white rounded-xl border border-[#23213A]/10 overflow-hidden divide-y divide-[#23213A]/5">
              {allDevotions.length > 0 ? (
                allDevotions.map((dev) => (
                  <button
                    key={dev.id}
                    onClick={() => setSelectedDevotion(dev)}
                    className="w-full text-left p-4 md:p-5 flex items-center justify-between hover:bg-[#FBF7EE] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#E3A857]/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-[#E3A857]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-[#23213A]">{dev.title}</h4>
                          {completedIds.includes(dev.id) && (
                            <CheckCircle className="w-4 h-4 text-[#4A6355]" />
                          )}
                        </div>
                        <p className="text-xs text-[#23213A]/50 mt-0.5">{dev.bible_reference} • {dev.author}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[#23213A]/40 font-medium flex-shrink-0 ml-4">
                      {new Date(dev.date).toLocaleDateString()}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-[#23213A]/50">No past devotions available yet.</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Devotion Detail Modal */}
      {selectedDevotion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedDevotion(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 md:p-12 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedDevotion(null)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#FBF7EE] transition"
            >
              <X className="w-5 h-5 text-[#23213A]" />
            </button>

            <div className="flex items-center gap-2 text-[#E3A857] mb-4">
              <Calendar className="w-4 h-4" strokeWidth={2} />
              <span className="text-xs uppercase tracking-widest font-semibold">
                {new Date(selectedDevotion.date).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl text-[#23213A] mb-2">
              {selectedDevotion.title}
            </h2>
            <p className="text-sm text-[#23213A]/50 mb-6">
              By {selectedDevotion.author} • {selectedDevotion.bible_reference}
            </p>
            <div className="font-serif text-lg leading-relaxed text-[#23213A]/80 whitespace-pre-wrap">
              {selectedDevotion.content}
            </div>

            {/* NEW: Mark as Read + social proof count inside the modal too */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => handleMarkAsRead(selectedDevotion.id)}
                disabled={completedIds.includes(selectedDevotion.id) || markingId === selectedDevotion.id}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${
                  completedIds.includes(selectedDevotion.id)
                    ? 'bg-[#4A6355]/10 text-[#4A6355] cursor-default'
                    : 'bg-[#23213A] text-[#FBF7EE] hover:bg-[#171B33]'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {completedIds.includes(selectedDevotion.id)
                  ? 'Marked as Read'
                  : markingId === selectedDevotion.id
                  ? 'Saving…'
                  : 'Mark as Read'}
              </button>
              {devotionCounts[selectedDevotion.id] !== undefined && (
                <span className="text-xs text-[#23213A]/50">
                  {devotionCounts[selectedDevotion.id]} {devotionCounts[selectedDevotion.id] === 1 ? 'person has' : 'people have'} read this
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}