'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';

export default function AboutPage() {
  // Rotating text for the button
  const actions = [
    'Share the Bible',
    'Share a Verse',
    'Transform Lives',
    'Spread the Word',
    'Build Community',
  ];

  const [currentAction, setCurrentAction] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAction((prev) => (prev + 1) % actions.length);
    }, 3000); // Changes every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // WhatsApp integration - Your number
  const phoneNumber = '256756348528'; // 0756348528 formatted for WhatsApp
  const whatsappMessage = encodeURIComponent(
    'Hello! I would like to become a partner with Christ-Like and help share Scripture with the world.'
  );
  const whatsappLink = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;

  return (
    <>
      {/* Hero Section - Mission */}
      <main className="sticky top-0 z-10 min-h-[100dvh] w-full overflow-hidden bg-black">
        <div className="absolute inset-0">
          <img
            src="https://i.swncdn.com/media/640w/via/8240-man-holding-phone-streaming-audio-bible-getty.jpg"
            alt="Reading scripture on a phone"
            className="absolute inset-0 h-full w-full object-cover object-[78%_center] sm:object-[72%_center] md:object-[65%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/10 sm:via-black/60 sm:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 sm:from-black/50 sm:via-transparent sm:to-transparent" />
        </div>

        <div className="relative z-10 flex min-h-[100dvh] w-full flex-col justify-between px-4 pb-8 pt-24 xs:px-5 sm:px-10 sm:pb-14 sm:pt-32 md:px-16 md:pb-16 md:pt-36 lg:px-20 lg:pb-20">
          <h1 className="font-[family-name:var(--font-display)] text-[2rem] leading-none text-white xs:text-[2.25rem] sm:text-6xl md:text-7xl lg:text-8xl">
            Our <span className="italic">Mission</span>
          </h1>
          <p className="max-w-[12rem] self-end text-right text-sm leading-snug text-white/90 xs:max-w-[13rem] sm:max-w-xs sm:text-base md:max-w-sm md:text-lg">
            To lead people to become fully devoted followers of Christ.
          </p>
        </div>
      </main>

      {/* Our Story Section */}
      <section className="sticky top-0 z-20 bg-[#F5EFE6] py-14 sm:py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-start justify-between gap-4 sm:mb-16">
            <div className="max-w-3xl">
              <h2 className="font-[family-name:var(--font-display)] text-2xl leading-tight text-[#5A4A4A] xs:text-3xl sm:text-5xl lg:text-6xl">
                It All Started With a <span className="italic">Question:</span>
              </h2>
              <p className="mt-4 font-[family-name:var(--font-display)] text-xl italic leading-tight text-[#5A4A4A] xs:text-2xl sm:text-4xl lg:text-5xl">
                "How could new technologies change the way we engage with the Bible today?"
              </p>
            </div>
            <div className="hidden lg:block shrink-0">
              <div className="relative h-24 w-24">
                <div className="absolute inset-0 animate-spin-slow">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute left-1/2 top-1/2 h-12 w-1.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#D4A5A5] to-[#9CAF88]"
                      style={{
                        transform: `rotate(${i * 30}deg) translateY(-50%)`,
                        transformOrigin: 'center 48px',
                      }}
                    />
                  ))}
                </div>
                <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#D4A5A5] to-[#9CAF88]" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#D4A5A5]/20 via-[#F5EFE6] to-[#9CAF88]/20 p-4 shadow-2xl sm:rounded-3xl sm:p-8">
                <img
                  src="https://cdn.prod.website-files.com/68a2d1038ded21fa4f161139/68d128ae615194d9adcab469_YouVersion%20Website%20Placeholder%20Image%20(8)%20(1).jpg"
                  alt="Christ-Like Bible app on phone"
                  className="h-auto w-full object-contain"
                />
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#5A4A4A] xs:text-2xl sm:text-3xl">
                We're building a movement that invites everyone into a daily rhythm with God's Word.
              </h3>
              <div className="mt-6 space-y-5 text-base leading-relaxed text-[#5A4A4A]/80 sm:mt-8 sm:space-y-6 sm:text-lg">
                <p>
                  At Christ-Like, we believe something powerful happens when people draw near to God through Scripture.
                  That belief began with a simple desire to remove the barriers that kept people from reading the Bible.
                </p>
                <p>
                  What started as a question has quickly become a global movement, getting Scripture to people around
                  the world like never before. From audio devotionals to interactive Bible reading, everything we build
                  is centered around one mission: helping you become more like Jesus.
                </p>
              </div>

              <div className="mt-8 rounded-2xl bg-white/60 p-5 shadow-lg backdrop-blur-sm sm:mt-10 sm:p-8">
                <blockquote className="font-[family-name:var(--font-display)] text-lg italic text-[#5A4A4A] sm:text-xl">
                  "Your word is a lamp for my feet, a light on my path."
                </blockquote>
                <cite className="mt-3 block text-sm font-medium text-[#D4A5A5] not-italic">
                  — Psalm 119:105 (NIV)
                </cite>
              </div>

              <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#D4A5A5]/10 to-[#9CAF88]/10 p-5 sm:mt-6 sm:p-8">
                <blockquote className="font-[family-name:var(--font-display)] text-base italic text-[#5A4A4A] sm:text-lg">
                  "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness."
                </blockquote>
                <cite className="mt-3 block text-sm font-medium text-[#5A4A4A]/70 not-italic">
                  — 2 Timothy 3:16 (NIV)
                </cite>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="sticky top-0 z-30 bg-[#1a1a1a] py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <blockquote className="text-center">
            <p className="font-[family-name:var(--font-display)] text-xl leading-relaxed text-white xs:text-2xl sm:text-4xl lg:text-5xl">
              "God's mission is greater than anything we could ask or imagine. He is moving, and He invites us to be a part of it."
            </p>
            <footer className="mt-8 sm:mt-10">
              <p className="font-[family-name:var(--font-display)] text-lg italic text-white/80 sm:text-xl">
                Bobby Gruenewald
              </p>
              <p className="mt-1 text-base italic text-white/60 sm:text-lg">
                CEO &amp; Founder, YouVersion
              </p>
            </footer>
          </blockquote>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
      </section>

      {/* Partners Section */}
      <section className="sticky top-0 z-40 min-h-[100dvh] bg-[#1a1a1a] py-14 sm:py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center">
              <h2 className="font-[family-name:var(--font-display)] text-2xl leading-tight text-white xs:text-3xl sm:text-5xl lg:text-6xl">
                <span className="italic">Our Partners</span> Bring{' '}
                <span className="italic">Our Shared Vision</span> To Life
              </h2>
              <p className="mt-6 text-base leading-relaxed text-white/70 sm:mt-8 sm:text-lg">
                We thrive because of our global partnership network. From Bible translators to local
                churches and content creators, our partners bring Scripture to life in local
                languages, cultural contexts, and faith journeys around the world.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 sm:mt-10 sm:gap-4">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#D4A5A5] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-[#D4A5A5]/30 transition hover:bg-[#C99595] sm:px-8 sm:py-4 sm:text-base"
                >
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  Become a Partner
                </a>
                <button className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white transition hover:border-white/60 hover:bg-white/5 sm:px-8 sm:py-4 sm:text-base">
                  Meet Our Global Partners
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
                <img
                  src="https://cdn.prod.website-files.com/68a2d1038ded21fa4f161139/68d132c61a3fa852ba222b88_YouVersion%20Website%20Image%20(1).avif"
                  alt="People engaging with Scripture together"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="sticky top-0 z-50 min-h-[100dvh] bg-gradient-to-br from-[#F5EFE6] via-white to-[#F5EFE6]/50 py-14 sm:py-20 lg:py-32">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl leading-tight text-[#5A4A4A] xs:text-3xl sm:text-5xl lg:text-6xl">
            <span className="italic">Be Part</span> of What God Is Doing{' '}
            <br className="hidden sm:block" />
            Through <span className="text-[#D4A5A5]">Christ-Like</span>
          </h2>

          <p className="mt-6 text-base leading-relaxed text-[#5A4A4A]/80 sm:mt-8 sm:text-lg">
            Every feature, every translation, every life transformed — it's all made possible by a global
            community of people who believe in the power of Scripture. Whether you give, serve, or share,
            your part matters.
          </p>

          <div className="mt-8 sm:mt-12">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex w-full max-w-xs items-center justify-center gap-3 rounded-full bg-[#D4A5A5] px-6 py-4 text-base font-medium text-white transition-all hover:bg-[#C99595] hover:shadow-2xl hover:shadow-[#D4A5A5]/40 hover:scale-105 sm:w-auto sm:max-w-none sm:px-10 sm:py-5 sm:text-lg"
            >
              <span className="min-w-0 text-left sm:min-w-[180px]">
                {currentAction === 0 && 'Share the Bible'}
                {currentAction === 1 && 'Share a Verse'}
                {currentAction === 2 && 'Transform Lives'}
                {currentAction === 3 && 'Spread the Word'}
                {currentAction === 4 && 'Build Community'}
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1 sm:h-6 sm:w-6" />
            </a>
          </div>

          <div className="mt-10 rounded-2xl bg-white/60 p-5 shadow-lg backdrop-blur-sm sm:mt-16 sm:p-8">
            <blockquote className="font-[family-name:var(--font-display)] text-lg italic text-[#5A4A4A] sm:text-xl">
              "Go therefore and make disciples of all nations... teaching them to observe all that I have commanded you."
            </blockquote>
            <cite className="mt-3 block text-sm font-medium text-[#D4A5A5] not-italic">
              — Matthew 28:19-20 (ESV)
            </cite>
          </div>
        </div>
      </section>
    </>
  );
}