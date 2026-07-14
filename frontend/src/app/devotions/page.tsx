'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Calendar, BookOpen, X } from 'lucide-react';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const todayRes = await fetch(`${API_URL}/api/devotions/today`);
        if (todayRes.ok) setTodayDevotion(await todayRes.json());

        const allRes = await fetch(`${API_URL}/api/devotions`);
        if (allRes.ok) setAllDevotions(await allRes.json());
      } catch (err) {
        console.error("Failed to fetch devotions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex bg-[#FBF7EE] min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#23213A]">
            Daily Devotions
          </h1>
          <p className="text-[#23213A]/50 mt-1">Daily bread for your spiritual journey.</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#23213A]/20 border-t-[#23213A] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Today's Devotion Feature */}
            {todayDevotion && (
              <div className="bg-white p-8 md:p-12 rounded-2xl border border-[#23213A]/10 shadow-sm mb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#E3A857]/5 rounded-full -mr-32 -mt-32" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-[#E3A857] mb-4">
                    <Calendar className="w-4 h-4" strokeWidth={2} />
                    <span className="text-xs uppercase tracking-widest font-semibold">Today&apos;s Devotion</span>
                  </div>
                  <h2 className="font-[family-name:var(--font-display)] text-3xl text-[#23213A] mb-2">
                    {todayDevotion.title}
                  </h2>
                  <p className="text-sm text-[#23213A]/50 mb-6">By {todayDevotion.author} • {todayDevotion.bible_reference}</p>
                  <div className="font-serif text-lg leading-relaxed text-[#23213A]/80 whitespace-pre-wrap">
                    {todayDevotion.content}
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
                    className="w-full text-left p-5 flex items-center justify-between hover:bg-[#FBF7EE] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#E3A857]/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-[#E3A857]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h4 className="font-medium text-[#23213A]">{dev.title}</h4>
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
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-8 md:p-12 relative"
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
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[#23213A] mb-2">
              {selectedDevotion.title}
            </h2>
            <p className="text-sm text-[#23213A]/50 mb-6">
              By {selectedDevotion.author} • {selectedDevotion.bible_reference}
            </p>
            <div className="font-serif text-lg leading-relaxed text-[#23213A]/80 whitespace-pre-wrap">
              {selectedDevotion.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}