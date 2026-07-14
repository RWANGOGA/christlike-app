'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Play, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper to extract YouTube Video ID from any YouTube URL
function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function SeriesPage() {
  const params = useParams();
  const seriesId = params.id as string;
  
  const [sermons, setSermons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<any>(null);

  useEffect(() => {
    const fetchSermons = async () => {
      try {
        const res = await fetch(`${API_URL}/api/sermon-series/${seriesId}/sermons`);
        if (res.ok) {
          const data = await res.json();
          setSermons(data);
          if (data.length > 0) setActiveVideo(data[0]); // Auto-play first video
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchSermons();
  }, [seriesId]);

  return (
    <div className="flex bg-[#FBF7EE] min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 max-w-6xl mx-auto">
        <Link href="/sermons" className="inline-flex items-center gap-2 text-sm text-[#23213A]/60 hover:text-[#23213A] mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Series
        </Link>

        <header className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#23213A]">Series Messages</h1>
          <p className="text-[#23213A]/50 mt-1">Watch and listen to the messages.</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#23213A]/20 border-t-[#23213A] rounded-full animate-spin" />
          </div>
        ) : sermons.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Video Player */}
            <div className="lg:col-span-2">
              {activeVideo ? (
                <div className="bg-white rounded-2xl border border-[#23213A]/10 overflow-hidden shadow-sm">
                  <div className="aspect-video bg-black relative">
                    {getYouTubeId(activeVideo.video_url) ? (
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${getYouTubeId(activeVideo.video_url)}`}
                        title={activeVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/50">
                        <p>Video URL is not a valid YouTube link.</p>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h2 className="font-[family-name:var(--font-display)] text-xl text-[#23213A] mb-2">{activeVideo.title}</h2>
                    <p className="text-sm text-[#23213A]/50 mb-4">{activeVideo.speaker_name} • {activeVideo.bible_passage}</p>
                    <p className="text-[#23213A]/70 leading-relaxed">{activeVideo.description}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[#23213A]/50">Select a video to play.</p>
              )}
            </div>

            {/* Playlist Sidebar */}
            <div className="bg-white rounded-2xl border border-[#23213A]/10 overflow-hidden shadow-sm h-fit">
              <div className="p-4 border-b border-[#23213A]/5 bg-[#FBF7EE]">
                <h3 className="font-semibold text-[#23213A] text-sm uppercase tracking-wide">Playlist</h3>
              </div>
              <ul className="divide-y divide-[#23213A]/5 max-h-[600px] overflow-y-auto">
                {sermons.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => setActiveVideo(s)}
                      className={`w-full text-left p-4 flex gap-3 transition hover:bg-[#FBF7EE] ${
                        activeVideo?.id === s.id ? 'bg-[#E3A857]/10 border-l-4 border-[#E3A857]' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded bg-[#23213A]/5 flex items-center justify-center flex-shrink-0">
                        <Play className="w-3 h-3 text-[#23213A]/50" fill="currentColor" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#23213A] line-clamp-2">{s.title}</p>
                        <p className="text-xs text-[#23213A]/50 mt-1">{s.speaker_name}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-[#23213A]/10 text-center">
            <p className="text-[#23213A]/50">No sermons have been added to this series yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
