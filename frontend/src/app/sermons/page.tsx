'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Mic } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function SermonsPage() {
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const res = await fetch(`${API_URL}/api/sermon-series`);
        if (res.ok) setSeries(await res.json());
      } catch (err) { console.error("Failed to fetch", err); } 
      finally { setLoading(false); }
    };
    fetchSeries();
  }, []);

  return (
    <div className="flex bg-[#FBF7EE] min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#23213A]">Sermon Series</h1>
          <p className="text-[#23213A]/50 mt-1">Listen and grow through powerful messages.</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#23213A]/20 border-t-[#23213A] rounded-full animate-spin" />
          </div>
        ) : series.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map((s) => (
              <Link href={`/sermons/${s.id}`} key={s.id} className="bg-white rounded-2xl border border-[#23213A]/10 overflow-hidden hover:shadow-lg transition group cursor-pointer block">
                <div className="h-40 bg-[#23213A] relative flex items-center justify-center">
                  <Mic className="w-12 h-12 text-[#E3A857]/30" strokeWidth={1} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-[#E3A857] flex items-center justify-center opacity-0 group-hover:opacity-100 transition transform scale-75 group-hover:scale-100">
                      <svg className="w-6 h-6 text-[#171B33] ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-[family-name:var(--font-display)] text-lg text-[#23213A] mb-1 line-clamp-1">{s.title}</h3>
                  <p className="text-sm text-[#23213A]/50 mb-3">{s.speaker_name}</p>
                  <p className="text-sm text-[#23213A]/60 line-clamp-2 leading-relaxed">{s.description}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-[#23213A]/10 text-center">
            <Mic className="w-12 h-12 text-[#23213A]/20 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-[#23213A]/50">No sermon series have been published yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
