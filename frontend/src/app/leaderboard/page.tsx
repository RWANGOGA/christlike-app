'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Trophy, Flame } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

interface LeaderboardEntry {
  username: string;
  streak_count: number;
  total_completions: number;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Confirm the user is logged in, same pattern as other pages
        await api.get('/users/me');
        const data = await api.get('/api/leaderboard');
        setEntries(data);
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

  const medalColor = (index: number) => {
    if (index === 0) return 'text-[#E3A857]';
    if (index === 1) return 'text-[#9CA3AF]';
    if (index === 2) return 'text-[#B08D57]';
    return 'text-[#23213A]/30';
  };

  return (
    <div className="flex bg-[#FBF7EE] min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64 pt-20 md:pt-8 px-4 md:px-8 pb-8 max-w-3xl w-full">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-[#E3A857]" strokeWidth={1.5} />
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl text-[#23213A]">
                Leaderboard
              </h1>
              <p className="text-[#23213A]/50 mt-1 text-sm md:text-base">
                Believers walking faithfully, together.
              </p>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-xl border border-[#23213A]/10 overflow-hidden">
          {entries.length > 0 ? (
            <ul className="divide-y divide-[#23213A]/5">
              {entries.map((entry, index) => (
                <li
                  key={entry.username}
                  className="p-4 flex items-center justify-between hover:bg-[#FBF7EE] transition"
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold w-6 text-center ${medalColor(index)}`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-[#23213A]">{entry.username}</p>
                      <p className="text-xs text-[#23213A]/50">
                        {entry.total_completions} completed
                      </p>
                    </div>
                  </div>
                  {entry.streak_count > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E3A857]/10">
                      <Flame className="w-3.5 h-3.5 text-[#E3A857]" fill="currentColor" />
                      <span className="text-xs font-semibold text-[#23213A]">{entry.streak_count}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-[#23213A]/50">
              <p>No one has joined the leaderboard yet.</p>
              <p className="text-sm mt-2">
                Turn it on for yourself in Account Settings to appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}