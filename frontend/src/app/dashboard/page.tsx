'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { BookOpen, TrendingUp, Target, Flame } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_lessons: 0, total_categories: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await api.get('/users/me');
        setUser(userData);
        const progressData = await api.get('/users/me/progress');
        setProgress(progressData);
        const statsData = await api.get('/api/stats');
        setStats(statsData);

        try { await api.post('/users/me/activity', {}); } catch (e) {}
      } catch (error) {
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FBF7EE]">
        <div className="w-8 h-8 border-2 border-[#23213A]/20 border-t-[#23213A] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex bg-[#FBF7EE] min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64 pt-20 md:pt-8 px-4 md:px-8 pb-8 max-w-6xl w-full">
        <header className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl text-[#23213A]">
            Welcome back, {user?.username}
          </h1>
          <p className="text-[#23213A]/50 mt-1 text-sm md:text-base">Here is your spiritual growth overview.</p>

          {user?.streak_count > 0 && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-[#E3A857]/10 border border-[#E3A857]/20">
              <Flame className="w-4 h-4 text-[#E3A857]" fill="currentColor" />
              <span className="text-sm font-semibold text-[#23213A]">{user.streak_count} Day Streak</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="bg-white p-5 md:p-6 rounded-xl border border-[#23213A]/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#23213A]/50">Total Lessons</h3>
              <BookOpen className="w-5 h-5 text-[#E3A857]" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-semibold text-[#23213A]">{stats.total_lessons}</p>
            <p className="text-xs text-[#23213A]/40 mt-1">Across {stats.total_categories} categories</p>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-xl border border-[#23213A]/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#23213A]/50">Completed</h3>
              <Target className="w-5 h-5 text-[#E3A857]" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-semibold text-[#23213A]">
              {progress.filter((p) => p.status === 'completed').length}
            </p>
            <p className="text-xs text-[#23213A]/40 mt-1">Keep up the great work</p>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-xl border border-[#23213A]/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#23213A]/50">In Progress</h3>
              <TrendingUp className="w-5 h-5 text-[#E3A857]" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-semibold text-[#23213A]">
              {progress.filter((p) => p.status === 'in_progress').length}
            </p>
            <p className="text-xs text-[#23213A]/40 mt-1">Currently active lessons</p>
          </div>
        </div>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[#23213A] mb-4">
            Your Journey
          </h2>
          <div className="bg-white rounded-xl border border-[#23213A]/10 overflow-hidden">
            {progress.length > 0 ? (
              <ul className="divide-y divide-[#23213A]/5">
                {progress.map((item) => (
                  <li key={item.id} className="p-4 flex items-center justify-between hover:bg-[#FBF7EE] transition">
                    <div>
                      <p className="font-medium text-[#23213A]">Lesson #{item.lesson_id}</p>
                      <p className="text-sm text-[#23213A]/50">Status: {item.status}</p>
                    </div>
                    <span className="text-sm font-medium text-[#23213A]/70">{item.progress_percentage}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-[#23213A]/50">
                <p>You haven&apos;t started any lessons yet.</p>
                <button className="mt-4 px-4 py-2 bg-[#23213A] text-[#FBF7EE] text-sm rounded-lg hover:bg-[#171B33] transition">
                  Browse Lessons
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}