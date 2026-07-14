'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Lightbulb, BookOpen } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function FactsPage() {
  const [facts, setFacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchFacts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/facts`);
        if (res.ok) setFacts(await res.json());
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchFacts();
  }, []);

  return (
    <div className="flex bg-[#FBF7EE] min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#23213A]">Facts for Faith</h1>
          <p className="text-[#23213A]/50 mt-1">Deepen your understanding of Scripture and theology.</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#23213A]/20 border-t-[#23213A] rounded-full animate-spin" />
          </div>
        ) : facts.length > 0 ? (
          <div className="space-y-4">
            {facts.map((fact) => (
              <div key={fact.id} className="bg-white rounded-xl border border-[#23213A]/10 overflow-hidden shadow-sm">
                <button
                  onClick={() => setExpandedId(expandedId === fact.id ? null : fact.id)}
                  className="w-full text-left p-6 flex items-start justify-between gap-4 hover:bg-[#FBF7EE] transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#E3A857] bg-[#E3A857]/10 px-2.5 py-1 rounded-full">
                        {fact.category}
                      </span>
                      {fact.bible_reference && (
                        <span className="flex items-center gap-1 text-xs text-[#23213A]/50">
                          <BookOpen className="w-3 h-3" /> {fact.bible_reference}
                        </span>
                      )}
                    </div>
                    <h3 className="font-[family-name:var(--font-display)] text-lg text-[#23213A]">{fact.title}</h3>
                  </div>
                  <Lightbulb className={`w-5 h-5 text-[#23213A]/30 transition-transform ${expandedId === fact.id ? 'rotate-180 text-[#E3A857]' : ''}`} />
                </button>
                
                {expandedId === fact.id && (
                  <div className="px-6 pb-6 pt-0 border-t border-[#23213A]/5">
                    <p className="text-[#23213A]/70 leading-relaxed whitespace-pre-wrap mt-4">{fact.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-[#23213A]/10 text-center">
            <Lightbulb className="w-12 h-12 text-[#23213A]/20 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-[#23213A]/50">No facts have been published yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
