'use client';
import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { BookOpen, Play, Pause, Square, Volume2, Settings2, ChevronDown } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Book {
  bookid: number;
  name: string;
  chapters: number;
}

interface Verse {
  pk: number;
  verse: number;
  text: string;
}

function cleanVerseText(raw: string): string {
  return raw
    .replace(/<S>\d+<\/S>/g, '')
    .replace(/<sup>.*?<\/sup>/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export default function BibleReader() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBookPicker, setShowBookPicker] = useState(false);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [speechRate, setSpeechRate] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const synth = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Init speech synthesis + voice list
  useEffect(() => {
    if (typeof window === 'undefined') return;
    synth.current = window.speechSynthesis;

    const loadVoices = () => {
      const available = synth.current?.getVoices() || [];
      setVoices(available);
      const englishVoice = available.find((v) => v.lang.startsWith('en'));
      if (englishVoice) setSelectedVoice(englishVoice);
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => synth.current?.cancel();
  }, []);

  // 1. Fetch the list of books on mount
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch(`${API_URL}/api/bible/books`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setBooks(data);
        } else {
          console.error('API did not return a book list:', data);
        }
      } catch (err) {
        console.error('Failed to fetch books', err);
      }
    };
    fetchBooks();
  }, []);

  // 2. Fetch verses whenever book + chapter are both chosen
  useEffect(() => {
    if (selectedBookId === null || chapter === null) return;

    const fetchChapter = async () => {
      setLoading(true);
      setError('');
      setVerses([]);
      handleStop();
      try {
        const res = await fetch(`${API_URL}/api/bible/chapter/${selectedBookId}/${chapter}`);
        if (!res.ok) throw new Error('Chapter not found');
        const data = await res.json();
        if (Array.isArray(data)) {
          setVerses(data);
        } else {
          setError('No verses found for this chapter.');
        }
      } catch (err) {
        console.error('Failed to fetch chapter', err);
        setError('Could not load this chapter. Please try another.');
      } finally {
        setLoading(false);
      }
    };
    fetchChapter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBookId, chapter]);

  const selectedBook = books.find((b) => b.bookid === selectedBookId);

  const pickBook = (bookId: number) => {
    setSelectedBookId(bookId);
    setChapter(null); // force chapter picker to show next
    setShowBookPicker(false);
  };

  const pickChapter = (num: number) => {
    setChapter(num);
  };

  // Audio controls — operate on the real `verses` array now
  const handlePlay = () => {
    if (verses.length === 0) return;

    if (isPlaying) {
      synth.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (synth.current?.paused) {
      synth.current?.resume();
      setIsPlaying(true);
      return;
    }

    const verse = verses[currentVerseIndex];
    utteranceRef.current = new SpeechSynthesisUtterance(cleanVerseText(verse.text));
    utteranceRef.current.rate = speechRate;
    if (selectedVoice) utteranceRef.current.voice = selectedVoice;

    utteranceRef.current.onend = () => {
      setCurrentVerseIndex((prev) => {
        if (prev < verses.length - 1) {
          return prev + 1;
        }
        setIsPlaying(false);
        return prev;
      });
    };

    synth.current?.speak(utteranceRef.current);
    setIsPlaying(true);
  };

  // Continue to next verse whenever currentVerseIndex advances while playing
  useEffect(() => {
    if (!isPlaying || verses.length === 0) return;
    if (currentVerseIndex === 0) return; // first verse already spoken by handlePlay
    const verse = verses[currentVerseIndex];
    if (!verse) return;

    utteranceRef.current = new SpeechSynthesisUtterance(cleanVerseText(verse.text));
    utteranceRef.current.rate = speechRate;
    if (selectedVoice) utteranceRef.current.voice = selectedVoice;
    utteranceRef.current.onend = () => {
      setCurrentVerseIndex((prev) => {
        if (prev < verses.length - 1) return prev + 1;
        setIsPlaying(false);
        return prev;
      });
    };
    synth.current?.speak(utteranceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVerseIndex]);

  const handleStop = () => {
    synth.current?.cancel();
    setIsPlaying(false);
    setCurrentVerseIndex(0);
  };

  const handleRateChange = (newRate: number) => {
    setSpeechRate(newRate);
    if (utteranceRef.current) utteranceRef.current.rate = newRate;
  };

  return (
    <div className="flex bg-[#FBF7EE] min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#23213A]">
            Read the Bible
          </h1>
          <p className="text-[#23213A]/50 mt-1">Immerse yourself in the Word.</p>
        </header>

        {/* Book selector bar */}
        <div className="bg-white p-4 rounded-xl border border-[#23213A]/10 mb-4 relative">
          <button
            onClick={() => setShowBookPicker((s) => !s)}
            className="flex items-center gap-2 text-[#23213A] font-medium"
          >
            <BookOpen className="w-5 h-5 text-[#E3A857]" strokeWidth={1.5} />
            {selectedBook ? selectedBook.name : 'Choose a book'}
            <ChevronDown className={`w-4 h-4 text-[#23213A]/40 transition-transform ${showBookPicker ? 'rotate-180' : ''}`} />
          </button>

          {showBookPicker && (
            <div className="mt-4 pt-4 border-t border-[#23213A]/10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-72 overflow-y-auto">
              {books.map((book) => (
                <button
                  key={book.bookid}
                  onClick={() => pickBook(book.bookid)}
                  className={`px-3 py-2 rounded-lg text-sm text-left transition ${
                    book.bookid === selectedBookId
                      ? 'bg-[#E3A857]/15 text-[#23213A] font-medium'
                      : 'text-[#23213A]/70 hover:bg-[#23213A]/5'
                  }`}
                >
                  {book.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chapter picker — appears once a book is chosen but no chapter yet, or on demand */}
        {selectedBook && (
          <div className="bg-white p-4 rounded-xl border border-[#23213A]/10 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#23213A]/70">
                {selectedBook.name} — {chapter ? `Chapter ${chapter}` : 'choose a chapter'}
              </span>
              {chapter !== null && (
                <button
                  onClick={() => setChapter(null)}
                  className="text-xs text-[#E3A857] font-medium hover:underline"
                >
                  Change chapter
                </button>
              )}
            </div>

            {chapter === null && (
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => pickChapter(num)}
                    className="aspect-square rounded-lg text-sm font-medium text-[#23213A]/70 bg-[#FBF7EE] hover:bg-[#E3A857]/15 hover:text-[#23213A] transition"
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Audio Player Controls */}
        {verses.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-[#23213A]/10 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePlay}
                  className="w-12 h-12 rounded-full bg-[#E3A857] flex items-center justify-center hover:bg-[#E3A857]/90 transition"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-[#171B33]" fill="currentColor" />
                  ) : (
                    <Play className="w-5 h-5 text-[#171B33] ml-1" fill="currentColor" />
                  )}
                </button>
                <button
                  onClick={handleStop}
                  className="w-10 h-10 rounded-full bg-[#23213A]/10 flex items-center justify-center hover:bg-[#23213A]/20 transition"
                >
                  <Square className="w-4 h-4 text-[#23213A]" fill="currentColor" />
                </button>
                <div className="flex items-center gap-2 text-sm text-[#23213A]/60">
                  <Volume2 className="w-4 h-4" />
                  <span>Verse {currentVerseIndex + 1} of {verses.length}</span>
                </div>
              </div>

              <button
                onClick={() => setShowSettings((s) => !s)}
                className="p-2 rounded-lg hover:bg-[#23213A]/5 transition"
              >
                <Settings2 className="w-5 h-5 text-[#23213A]" />
              </button>
            </div>

            {showSettings && (
              <div className="mt-4 pt-4 border-t border-[#23213A]/10 space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#23213A]/70 mb-2 block">
                    Playback Speed: {speechRate}x
                  </label>
                  <div className="flex gap-2">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleRateChange(rate)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          speechRate === rate
                            ? 'bg-[#E3A857] text-[#171B33]'
                            : 'bg-[#23213A]/10 text-[#23213A]/70 hover:bg-[#23213A]/20'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

               <div>
  <label className="text-xs font-medium text-[#23213A]/70 mb-2 block">Voice</label>
  <select
    value={selectedVoice?.name || ''}
    onChange={(e) => {
      const voice = voices.find((v) => v.name === e.target.value);
      setSelectedVoice(voice || null);
    }}
    className="w-full px-3 py-2 rounded-lg border border-[#23213A]/15 text-sm"
  >
    {voices.map((voice) => {
      const guessedGender = /female|zira|samantha|susan|karen|moira|tessa|veena|fiona/i.test(voice.name)
        ? '(likely female)'
        : /male|david|alex|daniel|fred|george|james|thomas/i.test(voice.name)
        ? '(likely male)'
        : '';
      return (
        <option key={voice.name} value={voice.name}>
          {voice.name} — {voice.lang} {guessedGender}
        </option>
      );
    })}
  </select>
</div>
              </div>
            )}
          </div>
        )}

        {/* Reading Area */}
        <div className="bg-white p-8 md:p-12 rounded-xl border border-[#23213A]/10 min-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-[#23213A]/20 border-t-[#23213A] rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="text-center text-[#23213A]/50">{error}</p>
          ) : verses.length > 0 ? (
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl text-[#23213A] mb-6 border-b border-[#23213A]/10 pb-4">
                {selectedBook?.name} {chapter}
              </h2>
              <div className="space-y-4">
                {verses.map((verse, index) => (
                  <p
                    key={verse.pk}
                    className={`font-serif text-lg leading-relaxed transition-all duration-300 p-2 rounded-lg ${
                      index === currentVerseIndex && isPlaying
                        ? 'bg-[#E3A857]/20 text-[#23213A]'
                        : 'text-[#23213A]/80'
                    }`}
                  >
                    <span className="text-[#E3A857] font-sans text-sm font-bold mr-2 align-super">
                      {verse.verse}
                    </span>
                    {cleanVerseText(verse.text)}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-[#23213A]/50">
              {selectedBook ? 'Choose a chapter above to begin reading.' : 'Choose a book to begin reading.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}