'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { BookOpen, Heart, Users, Sun, Headphones, Video, FileText, MessageCircle } from 'lucide-react';
import AuthModal from '@/components/AuthModal';

export default function Landing() {
  const [checking, setChecking] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const router = useRouter();

  // Listen for modal triggers from the global Header (?modal=login or ?modal=register)
  useEffect(() => {
    // Only run on the client to avoid Next.js build-time errors
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const modal = params.get('modal');
      
      if (modal === 'login' || modal === 'register') {
        setAuthMode(modal === 'login' ? 'login' : 'register');
        setShowAuth(true);
        
        // Clean up the URL so it doesn't stay in the browser history
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await api.get('/users/me');
        // Redirect based on user role
        if (user.is_admin) {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      } catch {
        setChecking(false);
      }
    };
    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5EFE6]">
        <div className="w-8 h-8 border-2 border-[#D4A5A5]/30 border-t-[#D4A5A5] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    // pt-24 ensures content isn't hidden behind the fixed global Header
    <div className="relative min-h-screen bg-[#F5EFE6] overflow-hidden flex flex-col pt-24">
      
      {/* Hero Section */}
      <main className="relative z-10 flex-1">
        <section className="relative">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://dwellapp.io/assets/home/phone-preview-primary-devotional-62fa5a823164bd83b680bccca92135a314c7bf9d13d9e1184dc682998d68dad4.jpg')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F5EFE6]/95 via-[#F5EFE6]/85 to-[#F5EFE6]" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-28 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4A5A5]/10 border border-[#D4A5A5]/20 mb-6">
              <Heart className="w-4 h-4 text-[#D4A5A5]" fill="currentColor" />
              <span className="text-xs uppercase tracking-wider text-[#5A4A4A] font-medium">
                Come As You Are
              </span>
            </div>

            <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl lg:text-6xl leading-tight text-[#5A4A4A] mb-4 sm:mb-6">
              Let His Word dwell in you<br />
              <span className="text-[#D4A5A5] italic">richly.</span>
            </h1>

            <p className="text-[#5A4A4A]/70 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
              For the weary heart, the searching soul, the one who longs to know Him
              more — this is your quiet place. Scripture to read, voices to carry you,
              and a family of believers holding you up in prayer.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={() => { setAuthMode('register'); setShowAuth(true); }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#D4A5A5] text-white font-semibold hover:bg-[#C99595] transition shadow-xl shadow-[#D4A5A5]/30"
              >
                Begin Your Walk — It's Free
              </button>
              <button
                onClick={() => { setAuthMode('login'); setShowAuth(true); }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full border-2 border-[#5A4A4A]/20 text-[#5A4A4A] font-medium hover:bg-[#5A4A4A]/5 transition"
              >
                Welcome Back
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-8 pt-8 border-t border-[#5A4A4A]/10 max-w-lg mx-auto">
              <div>
                <p className="text-xl sm:text-3xl font-bold text-[#5A4A4A]">66</p>
                <p className="text-xs sm:text-sm text-[#5A4A4A]/60">Books of Scripture</p>
              </div>
              <div>
                <p className="text-xl sm:text-3xl font-bold text-[#5A4A4A]">Audio</p>
                <p className="text-xs sm:text-sm text-[#5A4A4A]/60">& Text</p>
              </div>
              <div>
                <p className="text-xl sm:text-3xl font-bold text-[#5A4A4A]">100%</p>
                <p className="text-xs sm:text-sm text-[#5A4A4A]/60">Free, Always</p>
              </div>
            </div>
          </div>
        </section>

        {/* Discover the Power of Listening to the Bible Section */}
        <section className="py-12 sm:py-20 bg-[#7A6A6A]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-4xl lg:text-5xl text-white text-center mb-10 sm:mb-16">
              Discover the Power of Listening to the Bible
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-12">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden shadow-xl">
                  <img
                    src="https://dwellapp.io/assets/home/listening/mother-resting-fbbc00afc414ebd174b1302cdd4c2c4297d90870d0058dd08f91096c242925c2.png"
                    alt="Mother resting with headphones"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl text-white mb-3">
                  Hear God's Word come alive
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Bring the teachings and stories of Scripture to life, not just
                  reading the words, but hearing them read over you
                </p>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden shadow-xl">
                  <img
                    src="https://dwellapp.io/assets/home/listening/woman-running-07334e909253cc82d66f6a9fff9f4f113394cfc2cdc21d8a799c36264408b886.png"
                    alt="Woman running with headphones"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl text-white mb-3">
                  Turn ordinary moments into divine encounters
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Transform your daily moments, such as exercise or
                  chores around the house, into divine encounters
                </p>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden shadow-xl">
                  <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfvPPBlIFVLieF6YPAQ86ixu6ARnAWUysOXksdRqQGW0zL2XCxDDw3H2s7&s=10"
                    alt="Man smiling with headphones"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl text-white mb-3">
                  Build the Bible habit you've always wanted
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Develop a consistent Scripture routine, establishing this
                  deeply-rooted spiritual practice for life
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Biblical Formation Section */}
          <div className="mt-8 mb-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative h-[280px] sm:h-[400px] lg:h-[500px] shadow-2xl">
                <img
                  src="https://dwellapp.io/assets/about_us/biblical-formation-e46920ce21ccc1bf0f217df3d22641f7d0f70ae6902b43447042e8d8774440f0.png"
                  alt="Biblical Formation"
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-[#F5EFE6]/40" />
              </div>

              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#9CAF88]/10 border border-[#9CAF88]/20 mb-6">
                  <BookOpen className="w-4 h-4 text-[#9CAF88]" />
                  <span className="text-xs uppercase tracking-wider text-[#5A4A4A] font-medium">Deep Formation</span>
                </div>

                <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-4xl lg:text-5xl leading-tight text-[#5A4A4A] mb-6">
                  Formed by Scripture,<br />
                  <span className="text-[#9CAF88] italic">transformed</span> by truth
                </h2>

                <p className="text-[#5A4A4A]/70 text-lg leading-relaxed mb-6">
                  Long before it was ever read silently from a page, the Word was
                  spoken aloud, heard in the gathered assembly, carried in the heart.
                  Christ-Like helps you reclaim that ancient rhythm — Scripture not
                  just studied, but lived in.
                </p>

                <p className="text-[#5A4A4A]/70 text-lg leading-relaxed mb-8">
                  On your commute. In the quiet before dawn. In the middle of an
                  ordinary Tuesday. Let His Word become the steady voice that shapes
                  your heart from the inside out.
                </p>

                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full">
                    <Headphones className="w-5 h-5 text-[#D4A5A5]" />
                    <span className="text-sm text-[#5A4A4A]">Audio First</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full">
                    <Sun className="w-5 h-5 text-[#D4A5A5]" />
                    <span className="text-sm text-[#5A4A4A]">Daily Rhythm</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full">
                    <Heart className="w-5 h-5 text-[#D4A5A5]" />
                    <span className="text-sm text-[#5A4A4A]">Heart Transformation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-16 mb-32">
            <div className="text-center mb-16">
              <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-4xl text-[#5A4A4A] mb-4">
                Everything your soul needs to draw near
              </h2>
              <p className="text-[#5A4A4A]/60 text-lg max-w-2xl mx-auto">
                Simple tools, held together by one purpose — to bring you closer to
                the Father, and to walk that road alongside others who love Him too.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-[#5A4A4A]/5 hover:shadow-xl transition">
                <div className="w-12 h-12 rounded-full bg-[#D4A5A5]/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-[#D4A5A5]" strokeWidth={1.5} />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl text-[#5A4A4A] mb-3">Bible Reader</h3>
                <p className="text-[#5A4A4A]/60 leading-relaxed">
                  All 66 books, ready when you are. Move from book to chapter with
                  ease, and let the Word meet you exactly where you are.
                </p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-[#5A4A4A]/5 hover:shadow-xl transition">
                <div className="w-12 h-12 rounded-full bg-[#9CAF88]/10 flex items-center justify-center mb-4">
                  <Headphones className="w-6 h-6 text-[#9CAF88]" strokeWidth={1.5} />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl text-[#5A4A4A] mb-3">Audio Bible</h3>
                <p className="text-[#5A4A4A]/60 leading-relaxed">
                  Hear Scripture spoken over you — in the car, on a walk, in the
                  stillness before sleep. Let it settle deep, not just pass by.
                </p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-[#5A4A4A]/5 hover:shadow-xl transition">
                <div className="w-12 h-12 rounded-full bg-[#D4A5A5]/10 flex items-center justify-center mb-4">
                  <Sun className="w-6 h-6 text-[#D4A5A5]" strokeWidth={1.5} />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl text-[#5A4A4A] mb-3">Daily Devotions</h3>
                <p className="text-[#5A4A4A]/60 leading-relaxed">
                  Meet Him first, before the day gets loud. A few honest minutes
                  each morning to anchor your heart in what's true.
                </p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-[#5A4A4A]/5 hover:shadow-xl transition">
                <div className="w-12 h-12 rounded-full bg-[#9CAF88]/10 flex items-center justify-center mb-4">
                  <Video className="w-6 h-6 text-[#9CAF88]" strokeWidth={1.5} />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl text-[#5A4A4A] mb-3">Sermon Series</h3>
                <p className="text-[#5A4A4A]/60 leading-relaxed">
                  Sit under teaching that goes deep, not just wide. Grow in wisdom
                  through voices poured out for your good.
                </p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-[#5A4A4A]/5 hover:shadow-xl transition">
                <div className="w-12 h-12 rounded-full bg-[#D4A5A5]/10 flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-[#D4A5A5]" strokeWidth={1.5} />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl text-[#5A4A4A] mb-3">Prayer Wall</h3>
                <p className="text-[#5A4A4A]/60 leading-relaxed">
                  You were never meant to carry it alone. Share what weighs on your
                  heart, and stand with others carrying theirs.
                </p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-[#5A4A4A]/5 hover:shadow-xl transition">
                <div className="w-12 h-12 rounded-full bg-[#9CAF88]/10 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-[#9CAF88]" strokeWidth={1.5} />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl text-[#5A4A4A] mb-3">Personal Notes</h3>
                <p className="text-[#5A4A4A]/60 leading-relaxed">
                  Write down what He's showing you. Keep the moments that mattered,
                  so you can look back and remember how far you've come.
                </p>
              </div>
            </div>
          </div>

          {/* Something for Everyone Section */}
          <div className="mt-16 mb-32">
            <div className="text-center mb-12">
              <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl text-[#5A4A4A] mb-4">
                Wherever You Are, He Meets You There
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <button className="px-6 py-2.5 rounded-full border-2 border-[#5A4A4A]/15 text-[#5A4A4A]/50 text-sm font-medium hover:border-[#D4A5A5] hover:text-[#D4A5A5] transition">
                Scripture
              </button>
              <button className="px-6 py-2.5 rounded-full bg-[#E8DDD5] text-[#5A4A4A] text-sm font-medium">
                Devotional
              </button>
              <button className="px-6 py-2.5 rounded-full border-2 border-[#5A4A4A]/15 text-[#5A4A4A]/50 text-sm font-medium hover:border-[#D4A5A5] hover:text-[#D4A5A5] transition">
                Sleep
              </button>
              <button className="px-6 py-2.5 rounded-full border-2 border-[#5A4A4A]/15 text-[#5A4A4A]/50 text-sm font-medium hover:border-[#D4A5A5] hover:text-[#D4A5A5] transition">
                Kids
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
              <div className="hidden lg:block">
                <div className="bg-white shadow-2xl">
                  <img
                    src="https://dwellapp.io/assets/home/phone-preview-primary-devotional-62fa5a823164bd83b680bccca92135a314c7bf9d13d9e1184dc682998d68dad4.jpg"
                    alt="Christ-Like Devotional Player"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              <div className="text-center lg:text-left">
                <p className="text-[#5A4A4A]/70 text-xl lg:text-2xl leading-relaxed mb-8">
                  Every day, a new devotional waiting to meet you — not to add to
                  your list, but to remind you that you're not carrying this alone.
                </p>

                <div className="bg-white/80 backdrop-blur-sm p-4 shadow-lg border border-[#5A4A4A]/5">
                  <div className="flex items-center gap-4">
                    <button className="w-14 h-14 rounded-full bg-[#E8DDD5] flex items-center justify-center hover:bg-[#D4A5A5] transition">
                      <svg className="w-6 h-6 text-[#5A4A4A]" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    </button>
                    <div className="flex-1">
                      <p className="text-[#5A4A4A] font-medium">Cast Your Cares On Him</p>
                      <div className="mt-2 h-1.5 bg-[#5A4A4A]/10 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-[#D4A5A5] rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 lg:hidden">
                  <div className="bg-white shadow-2xl max-w-xs mx-auto">
                    <img
                      src="https://dwellapp.io/assets/home/phone-preview-primary-devotional-62fa5a823164bd83b680bccca92135a314c7bf9d13d9e1184dc682998d68dad4.jpg"
                      alt="Christ-Like Devotional Player"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="bg-white shadow-2xl">
                  <img
                    src="https://dwellapp.io/assets/home/phone-preview-secondary-devotional-e1f51e505f1ea748064eb0c8e5ce4747aaee2a3367c89e9cead639fae0ddc7e7.jpg"
                    alt="Christ-Like Devotional Text"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>

            <div className="mt-16 text-center max-w-3xl mx-auto">
              <p className="text-[#5A4A4A]/60 text-lg leading-relaxed mb-8">
                Morning, midday, or the quiet hours before sleep — there's a
                devotional for the moment you're actually in, not the one you wish
                you had time for.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#D4A5A5]/20 flex items-center justify-center">
                    <Sun className="w-5 h-5 text-[#D4A5A5]" />
                  </div>
                  <span className="text-[#5A4A4A] font-medium">Daily Content</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#9CAF88]/20 flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-[#9CAF88]" />
                  </div>
                  <span className="text-[#5A4A4A] font-medium">Audio & Text</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#D4A5A5]/20 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-[#D4A5A5]" />
                  </div>
                  <span className="text-[#5A4A4A] font-medium">Heart-Focused</span>
                </div>
              </div>
            </div>
          </div>

          {/* How Christ-Like for Churches Works Section */}
          <div className="mt-16 mb-32">
            <div className="text-center mb-16">
              <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl text-[#5A4A4A] mb-4">
                For Your Whole Church Family
              </h2>
              <p className="text-[#5A4A4A]/60 text-lg max-w-3xl mx-auto">
                One place for your congregation to gather around His Word, together.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4A5A5]/30 to-[#9CAF88]/30 rounded-[3rem] transform -rotate-3" />

                <div className="relative bg-white rounded-[2rem] overflow-hidden shadow-2xl">
                  <img
                    src="https://dwellapp.io/assets/churches-signup/person1-d6bc8888fbfa16255e9312488785246f4b344bcc6dab8d3e0715bdf8f5fae34c.jpg"
                    alt="Church member listening to Scripture"
                    className="w-full h-auto"
                  />
                </div>

                <div className="hidden sm:block absolute -bottom-8 -left-8 w-64 bg-white rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src="https://dwellapp.io/assets/churches-signup/person1-d6bc8888fbfa16255e9312488785246f4b344bcc6dab8d3e0715bdf8f5fae34c.jpg"
                    alt="Church member with headphones"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-display)] text-2xl sm:text-4xl text-[#5A4A4A] mb-6">
                  Move His Truth From Their Head to Their Heart
                </h3>
                <p className="text-[#5A4A4A]/70 text-lg leading-relaxed mb-8">
                  Christ-Like gives your church a simple way to keep Scripture close
                  to your people all week long — not just on Sunday morning, but in
                  the ordinary rhythm of their everyday lives.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#D4A5A5]/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Headphones className="w-4 h-4 text-[#D4A5A5]" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[#5A4A4A] mb-1">Audio & Text Resources</h4>
                      <p className="text-[#5A4A4A]/60 text-sm">
                        Give your members both listening and reading, so Scripture
                        fits into however they live their day.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#9CAF88]/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Users className="w-4 h-4 text-[#9CAF88]" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[#5A4A4A] mb-1">Congregation-Wide Access</h4>
                      <p className="text-[#5A4A4A]/60 text-sm">
                        One subscription, your whole church family walking together.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#D4A5A5]/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sun className="w-4 h-4 text-[#D4A5A5]" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[#5A4A4A] mb-1">Daily Devotionals</h4>
                      <p className="text-[#5A4A4A]/60 text-sm">
                        Curated content that helps your members build habits that
                        last far beyond Sunday.
                      </p>
                    </div>
                  </div>
                </div>

                <button className="mt-8 px-8 py-3.5 rounded-full bg-[#D4A5A5] text-white font-semibold hover:bg-[#C99595] transition shadow-lg shadow-[#D4A5A5]/30">
                  Learn More About Church Plans
                </button>
              </div>
            </div>
          </div>

          {/* Core Beliefs Section */}
          <div className="mt-16 mb-32">
            <div className="text-center mb-16">
              <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl text-[#5A4A4A] mb-4">
                What We Stand On
              </h2>
              <p className="text-[#5A4A4A]/60 text-lg max-w-3xl mx-auto">
                Every part of Christ-Like is built on convictions we won't move
                from — here's the ground beneath our feet.
              </p>
            </div>

            <div className="space-y-12 max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-8 md:p-12 border border-[#5A4A4A]/5 shadow-lg">
                <div className="mb-6">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl text-[#5A4A4A] mb-4">1. Scripture</h3>
                  <p className="text-[#5A4A4A] text-lg leading-relaxed font-medium">
                    We believe Holy Scripture is God-breathed and unfailing — a
                    wellspring of wisdom, guidance, and revelation for every soul who
                    comes thirsty.
                  </p>
                  <p className="text-[#5A4A4A]/60 text-sm mt-3 italic">
                    "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness." — 2 Timothy 3:16
                  </p>
                </div>
                <div className="h-48 overflow-hidden">
                  <img
                    src="https://dwellapp.io/assets/about_us/core_beliefs/scripture-mobile-e5873456ab13367cfc93afe341f02f611ca10adf4e09d346b296d6051592baba.png"
                    alt="Scripture"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-8 md:p-12 border border-[#5A4A4A]/5 shadow-lg">
                <div className="mb-6">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl text-[#5A4A4A] mb-4">2. Creeds</h3>
                  <p className="text-[#5A4A4A] text-lg leading-relaxed font-medium">
                    Anchored in the historic faith handed down to us, we stand with
                    believers across every generation, holding fast to the ancient
                    creeds — chief among them, the Nicene Creed.
                  </p>
                  <p className="text-[#5A4A4A]/60 text-sm mt-3 italic">
                    "For I delivered to you as of first importance what I also received: that Christ died for our sins in accordance with the Scriptures." — 1 Corinthians 15:3
                  </p>
                </div>
                <div className="h-48 overflow-hidden">
                  <img
                    src="https://dwellapp.io/assets/about_us/core_beliefs/experiences-mobile-ce10b2ce3bf0b43886407c4e6cb42ffda9124fe04609c232210a850eb46108d8.png"
                    alt="Creeds"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-8 md:p-12 border border-[#5A4A4A]/5 shadow-lg">
                <div className="mb-6">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl text-[#5A4A4A] mb-4">3. Many Sources, One Stream</h3>
                  <p className="text-[#5A4A4A] text-lg leading-relaxed font-medium">
                    Inspired by C.S. Lewis's vision of "Mere Christianity," we
                    celebrate the wide, beautiful family of the Church. Every
                    believer walking toward Christ is welcome at this table.
                  </p>
                  <p className="text-[#5A4A4A]/60 text-sm mt-3 italic">
                    "There is one body and one Spirit, just as you were called to the one hope that belongs to your call, one Lord, one faith, one baptism." — Ephesians 4:4-5
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 mt-6">
                  <span className="px-4 py-2 text-[#5A4A4A] text-sm font-medium">One Faith</span>
                  <span className="px-4 py-2 text-[#5A4A4A] text-sm font-medium">One Lord</span>
                  <span className="px-4 py-2 text-[#5A4A4A] text-sm font-medium">One Body in Christ</span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-8 md:p-12 border border-[#5A4A4A]/5 shadow-lg">
                <div className="mb-6">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl text-[#5A4A4A] mb-4">4. Guided Experiences</h3>
                  <p className="text-[#5A4A4A] text-lg leading-relaxed font-medium">
                    Every devotional, every reading plan, every word on Christ-Like
                    is crafted with reverence — never straying from the authority of
                    Scripture in faith and in life.
                  </p>
                  <p className="text-[#5A4A4A]/60 text-sm mt-3 italic">
                    "Your word is a lamp to my feet and a light to my path." — Psalm 119:105
                  </p>
                </div>
                <div className="h-48 overflow-hidden">
                  <img
                    src="https://dwellapp.io/assets/about_us/core_beliefs/unity-mobile-1791d429fb35d01a2c773d7687b57731e37882f57752dae3a30308cc4fb2e4f6.png"
                    alt="Guided Experiences"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center mb-24">
            <div className="p-6 sm:p-12">
              <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-4xl text-[#5A4A4A] mb-4">
                He is near to the brokenhearted.
              </h2>
              <p className="text-[#5A4A4A]/60 text-lg mb-8 max-w-2xl mx-auto">
                Wherever you are tonight, whatever you're carrying — come and see.
                Christ-Like is free, and it always will be.
              </p>
              <button
                onClick={() => { setAuthMode('register'); setShowAuth(true); }}
                className="px-10 py-4 bg-[#D4A5A5] text-white font-semibold hover:bg-[#C99595] transition shadow-xl shadow-[#D4A5A5]/30"
              >
                Come Home
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#5A4A4A]/10 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-[#5A4A4A]/50">
            © {new Date().getFullYear()} Christ-Like. Helping believers grow closer to Christ.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal
          initialMode={authMode}
          onSuccess={() => setShowAuth(false)}
          onClose={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}