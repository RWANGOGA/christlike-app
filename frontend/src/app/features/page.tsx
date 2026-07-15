'use client';

import { useState } from 'react';
import { Headphones, BookOpen, Heart, BarChart3, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Headphones,
    title: 'Audio Bible',
    description: 'Listen to Scripture anywhere. High-quality narration keeps God\'s Word in your ears during your commute, workout, or quiet moments.',
    verse: '"Faith comes by hearing, and hearing by the word of Christ." — Romans 10:17',
  },
  {
    icon: BookOpen,
    title: 'Daily Devotionals',
    description: 'Start your morning with curated reflections. Bite-sized spiritual nourishment designed to center your heart on Christ before the day begins.',
    verse: '"His mercies are new every morning; great is your faithfulness." — Lamentations 3:23',
  },
  {
    icon: Heart,
    title: 'Prayer Community',
    description: 'Share requests and pray for others globally. Experience the power of corporate prayer in a safe, encouraging space.',
    verse: '"For where two or three gather in my name, there am I with them." — Matthew 18:20',
  },
  {
    icon: BarChart3,
    title: 'Growth Tracking',
    description: 'Visualize your spiritual journey. Track reading streaks, memory verses, and daily habits to stay motivated in your walk.',
    verse: '"Let us run with perseverance the race marked out for us." — Hebrews 12:1',
  },
  {
    icon: Users,
    title: 'Reading Plans',
    description: 'Structured guides through books of the Bible. Stay consistent with community-driven schedules and group studies.',
    verse: '"Your word is a lamp for my feet, a light on my path." — Psalm 119:105',
  },
];

export default function FeaturesPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Same logic as before, but wraps back to 0 instead of stopping at the
  // last card. Because the transform is driven off activeIndex with a
  // 1.5s transition, wrapping makes every card glide back down and
  // re-stack on top of each other automatically — no extra animation code.
  const handleCardClick = () => {
    setActiveIndex((prev) => (prev + 1) % features.length);
  };

  return (
    <div className="bg-white min-h-screen">
      <section className="min-h-screen flex items-center py-12 sm:py-16 lg:py-20 px-5 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-24 items-center">

          {/* Left Side: Editorial Text */}
          <div className="max-w-xl text-center lg:text-left mx-auto lg:mx-0">
            <p className="text-[#1a1a1a] font-medium italic text-base sm:text-lg lg:text-xl mb-4 sm:mb-6">
              Trusted by Believers Worldwide
            </p>
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-[#1a1a1a] leading-[1.15] sm:leading-[1.1] mb-5 sm:mb-8 tracking-tight">
              Built for Discipleship. <br />
              <span className="font-[family-name:var(--font-display)] italic font-normal text-[#1a1a1a]">
                Beloved by the Church.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[#5A4A4A]/80 leading-relaxed mb-8 sm:mb-10">
              Our tools help you stay present in God's Word daily. When you open Christ-Like, you're joining a trusted space where spiritual growth and Scripture engagement are already happening, all over the world.
            </p>

            <Link
              href="/?modal=signup"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-[#1a1a1a] text-white rounded-full font-medium hover:bg-[#333] transition"
            >
              Start Your Journey
            </Link>
          </div>

          {/* Right Side: Fanned Card Stack */}
          <div className="relative h-[380px] sm:h-[460px] lg:h-[560px] w-full max-w-[280px] sm:max-w-sm lg:max-w-md mx-auto lg:mx-0">

            {/* Soft pink glow bleeding out from under the stack */}
            <div
              className="absolute -inset-x-4 sm:-inset-x-6 -bottom-4 sm:-bottom-6 top-10 sm:top-16 rounded-[2.5rem] blur-2xl sm:blur-3xl opacity-60 pointer-events-none"
              style={{
                background:
                  'radial-gradient(60% 60% at 70% 60%, rgba(212,165,165,0.45), rgba(212,165,165,0) 70%)',
              }}
            />

            {/* Decorative ghost cards peeking out behind the active stack,
                like the fanned deck edges in the reference screenshot */}
            {[0, 1, 2, 3].map((i) => (
              <div
                key={`ghost-${i}`}
                className="absolute inset-0 rounded-[1.5rem] sm:rounded-[2rem] bg-[#F5EFE6] border border-[#E8DFD3] pointer-events-none"
                style={{
                  transform: `translateY(${-4 - i * 4}px) translateX(${i * 6}px) rotate(${2 + i * 1.5}deg)`,
                  opacity: 0.35 - i * 0.06,
                  zIndex: i,
                }}
              />
            ))}

            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isTopCard = index === activeIndex;
              const isPastCard = index < activeIndex;

              // Calculate position based on how many cards have been clicked
              const stackOffset = index - activeIndex;

              // If the card has been clicked, it flies up and fades out.
              // When activeIndex wraps back to 0, this same math sends
              // every card sliding back into its stacked position.
              const translateY = isPastCard ? -300 : stackOffset * 12;
              const rotate = isPastCard ? 5 : stackOffset % 2 === 0 ? 2 : -2;
              const scale = isPastCard ? 0.9 : 1 - stackOffset * 0.04;
              const opacity = isPastCard ? 0 : 1;
              const zIndex = 50 - index;

              return (
                <div
                  key={index}
                  onClick={isTopCard ? handleCardClick : undefined}
                  className={`absolute inset-0 bg-[#F5EFE6] rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 lg:p-10 border border-[#E8DFD3] transition-all ease-in-out ${
                    isTopCard
                      ? 'cursor-pointer shadow-[0_25px_60px_-15px_rgba(212,165,165,0.5)]'
                      : 'shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]'
                  }`}
                  style={{
                    transform: `translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
                    zIndex: zIndex,
                    opacity: opacity,
                    // 1.5 seconds for that slow, deliberate reading pace
                    transitionDuration: '1500ms',
                  }}
                >
                  {/* Card Content */}
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center mb-4 sm:mb-6 lg:mb-8">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-[#D4A5A5]" strokeWidth={1.5} />
                      </div>

                      <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#1a1a1a] mb-2 sm:mb-3 lg:mb-4 tracking-tight">
                        {feature.title}
                      </h3>
                      <p className="text-[#5A4A4A]/80 leading-relaxed text-xs sm:text-sm lg:text-base">
                        {feature.description}
                      </p>
                    </div>

                    {/* Bible Verse at the bottom */}
                    <div className="mt-4 sm:mt-6 lg:mt-8 pt-3 sm:pt-4 lg:pt-6 border-t border-[#E8DFD3]">
                      <p className="font-[family-name:var(--font-display)] italic text-[#D4A5A5] text-xs sm:text-sm leading-relaxed">
                        {feature.verse}
                      </p>
                    </div>
                  </div>

                  {/* Click hint for top card */}
                  {isTopCard && index < features.length - 1 && (
                    <div className="absolute top-3 right-4 sm:top-6 sm:right-6 flex items-center gap-1 text-[10px] sm:text-xs font-medium text-[#5A4A4A]/40 uppercase tracking-widest">
                      Click to continue <ArrowRight className="w-3 h-3" />
                    </div>
                  )}

                  {/* Final Card State — now invites them to loop back */}
                  {isTopCard && index === features.length - 1 && (
                    <div className="absolute top-3 right-4 sm:top-6 sm:right-6 text-[10px] sm:text-xs font-medium text-[#9CAF88] uppercase tracking-widest">
                      Click to start over
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>
    </div>
  );
}