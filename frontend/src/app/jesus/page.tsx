'use client'; //  THIS FIXES THE ERROR

import { Great_Vibes } from 'next/font/google';

// Import the elegant script font for the Hero
const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-script',
});

export default function JesusPage() {
  return (
    <main className="bg-[#F5EFE6]">
      
      {/* ==========================================
          SECTION 1: HERO (Black Background)
      =========================================== */}
      <section className="bg-black min-h-screen flex items-center justify-center overflow-hidden">
        <h1 
          className={`${greatVibes.className} text-[#F5EFE6] text-[18vw] leading-none tracking-tight select-none`}
        >
          Jesus Christ
        </h1>
      </section>

      {/* ==========================================
          SECTION 2: A NEW BEGINNING (Document Style)
      =========================================== */}
      <section className="py-24 px-6 sm:px-12 lg:px-24 bg-[#F5EFE6]">
        <div className="max-w-3xl mx-auto">
          
          <h2 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold text-[#5A4A4A] text-center mb-12">
            A new beginning...
          </h2>

          <div className="space-y-8 text-[#5A4A4A]/80 text-lg sm:text-xl leading-relaxed font-sans">
            
            <p>
              To be truly made whole is to surrender to God's perfect plan and purpose for your life. It is a turning away from the shadows of our past and stepping into the marvelous light of Jesus. It is asking for His forgiveness and receiving the abundant, new life He promises.
            </p>

            <p className="italic text-[#5A4A4A]">
              Romans 10:9 says: <span className="font-medium">"If you declare with your mouth that Jesus is Lord, and believe in your heart that God raised him from the dead, you will be saved."</span>
            </p>

            <p>
              Salvation is not something we earn; it is the ultimate free gift of grace. When we receive it, we are adopted into the family of God.
            </p>

            <p>
              This is an unshakeable acceptance. It is the divine empowerment to live fully, with the sole purpose of reflecting His glory to a broken world.
            </p>

            <p>
              If your heart is searching, or if you know you need the peace that only Jesus brings, you can begin this journey right now. Surrender your heart to Him through this simple prayer:
            </p>

            <div className="bg-white/50 p-8 rounded-2xl border-l-4 border-[#D4A5A5] my-12 shadow-sm">
              <p className="text-[#5A4A4A] font-medium text-xl mb-4">
                Dear Jesus,
              </p>
              <p className="text-[#5A4A4A]/90 leading-loose">
                I come to You today. I know I have fallen short, and I am sorry. I believe You died for my sins and rose again. I open my heart and accept Your free gift of salvation. Be my Lord and my Savior. Guide my steps, fill me with Your Spirit, and help me to walk in Your light all the days of my life. 
                <br /><br />
                In Your holy name, Amen.
              </p>
            </div>

            <p>
              If you prayed that with a sincere heart, welcome to the family! You have just embarked on the greatest adventure of your life—the journey to follow Jesus. We would be honored to walk this path with you.
            </p>

          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 3: WHO IS JESUS? (Dark Two-Column)
      =========================================== */}
      <section className="bg-[#1a1a1a] py-24 px-6 sm:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          
          <h2 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl lg:text-6xl font-bold text-white text-center mb-16">
            Who Is Jesus?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 text-white/90 text-lg leading-relaxed">
            
            {/* LEFT COLUMN */}
            <div className="space-y-8">
              <p>
                The questions we ask about God are endless: <span className="italic">"Is God real?" "Is what we know about Him true?" "What does He have to do with my life?"</span> — and the list goes on.
              </p>

              <p>
                The Bible may not answer every philosophical question about God — and may even lead us to ask more — but on one thing it is absolutely definite: <span className="font-semibold text-white">the answer to the question, "Who is Jesus?"</span>
              </p>

              <p>
                Jesus commends the apostle Peter's confession of Him as <span className="italic">"the Messiah, the Son of the Living God"</span> (Matthew 16:16), because Jesus knew that who He is — and who He can be to us — has the power to change our lives forever.
              </p>

              <p>
                Jesus is so unique because two worlds collide in Him: <span className="font-semibold text-white">heaven and earth, the divine and the human.</span> He is not a myth. He is not a metaphor. He is the living Christ.
              </p>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-8">
              
              <div className="bg-white/5 border-l-2 border-[#D4A5A5] pl-6 py-2">
                <p className="text-sm uppercase tracking-widest text-[#D4A5A5] mb-3 font-medium">
                  C.S. Lewis — Former Atheist, Author of Mere Christianity
                </p>
                <p className="italic text-white/95 leading-relaxed">
                  "I was bringing in the great Christian difficulties... and I noticed that the house was full of specialists. On each specialist my own knowledge was thin and superficial. But the moment we began to talk about Christ, the atmosphere changed. The specialists fell silent. For here was something none of them had anticipated — a Man who claimed to be God, and backed up the claim with a life so compelling that history itself had to bend around Him."
                </p>
              </div>

              <div className="bg-white/5 border-l-2 border-[#9CAF88] pl-6 py-2">
                <p className="text-sm uppercase tracking-widest text-[#9CAF88] mb-3 font-medium">
                  Lee Strobel — Former Atheist, Award-Winning Journalist
                </p>
                <p className="italic text-white/95 leading-relaxed">
                  "After two years of investigating the evidence, I realized that Jesus Christ is not just a historical figure — He is the risen Son of God. The same power that raised Him from the dead is available to you today. Jesus is the answer to the deepest longings of the human heart."
                </p>
              </div>

              <p>
                Yes, Jesus' name is the name above all names. His star-breathing, storm-calming, miracle-working power is second to none. Yet, He is also the human Jesus — the personal friend who knows what you are going through and cares about you deeply.
              </p>

              <p>
                That is why the Bible also calls Him <span className="font-semibold text-white">"Immanuel"</span> — which means <span className="italic text-[#D4A5A5]">"God with us."</span>
              </p>

            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 4: JOHN 3:16 (Clean Centered Quote)
      =========================================== */}
      <section className="bg-white py-32 px-6 sm:px-12">
        <div className="max-w-4xl mx-auto text-center">
          
          <blockquote className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2d2d2d] leading-tight mb-8">
            For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.
          </blockquote>

          <cite className="text-lg sm:text-xl text-[#5A4A4A]/70 font-medium not-italic">
            — John 3:16 NIV
          </cite>

        </div>
      </section>

      {/* ==========================================
          SECTION 5: JESUS CARES! (Dark Background)
      =========================================== */}
      <section className="bg-black py-24 px-6 sm:px-12 lg:px-20">
        <div className="max-w-4xl mx-auto">
          
          {/* Centered Heading */}
          <h2 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl lg:text-6xl font-bold text-white text-center mb-12">
            Jesus Cares!
          </h2>

          {/* Centered Questions */}
          <div className="text-center mb-16">
            <p className="text-xl sm:text-2xl text-white/90 mb-4">
              Does Jesus care about you? <span className="font-semibold text-white">Yes, He does!</span>
            </p>
            <p className="text-xl sm:text-2xl text-white/90">
              How do we know this?
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8 text-white/90 text-lg sm:text-xl leading-relaxed">
            
            <p>
              Often we disqualify ourselves from God's love because of our history, our failures, and our shortcomings. We believe the lie that we are too broken, too far gone, or too unworthy. But sin has separated us from God, and we can never bridge that gap through self-improvement or good works.
            </p>

            <p>
              So how can we receive what we have not earned? The Bible declares that <span className="font-semibold text-white">nothing in all of creation can separate us from the love of God that is in Christ Jesus our Lord</span> (Romans 8:39). His love is not based on our performance, but on His perfect character.
            </p>

            <p>
              To accept God's love is to trust His patient, forgiving, and gracious stance toward us. Only Jesus has the power to free us from guilt, shame, and condemnation. Only He can give us a life of wholeness, purpose, and eternal hope.
            </p>

            <p className="text-2xl sm:text-3xl font-semibold text-white text-center mt-12">
              All we have to do is turn to Him.
            </p>

          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 6: CONCLUSION & CALL TO ACTION
      =========================================== */}
      <section className="bg-gradient-to-br from-[#D4A5A5]/15 via-[#F5EFE6] to-[#9CAF88]/15 py-32 px-6 sm:px-12">
        <div className="max-w-4xl mx-auto text-center">
          
          <h2 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold text-[#5A4A4A] mb-8">
            This Is Just The Beginning...
          </h2>

          <p className="text-xl text-[#5A4A4A]/80 mb-12 leading-relaxed max-w-3xl mx-auto">
            What you've read here is just the foundation. In your personal dashboard, you'll discover 
            <span className="font-semibold text-[#5A4A4A]"> daily devotions</span>, 
            <span className="font-semibold text-[#5A4A4A]"> the complete Bible</span> with audio, 
            <span className="font-semibold text-[#5A4A4A]"> a prayer community</span>, 
            <span className="font-semibold text-[#5A4A4A]"> sermon series</span>, and so much more to help you grow deeper in your faith.
          </p>

          <div className="space-y-6">
            <p className="text-lg text-[#5A4A4A]/70 mb-8">
              Ready to take the next step in your journey with Christ?
            </p>

            {/* Login Button */}
            <button
              onClick={() => window.location.href = '/?modal=login'}
              className="inline-block px-12 py-5 bg-[#D4A5A5] text-white text-xl font-semibold rounded-full hover:bg-[#C99595] transition shadow-2xl shadow-[#D4A5A5]/40 transform hover:-translate-y-1"
            >
              Sign In To Continue
            </button>

            <p className="text-sm text-[#5A4A4A]/60 mt-6">
              Already have an account? <span className="font-medium">Sign in to access your dashboard</span>
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-16 border-t border-[#5A4A4A]/10">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#D4A5A5]/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-[#D4A5A5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#5A4A4A]">Bible Reader</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#9CAF88]/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#5A4A4A]">Daily Devotions</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#D4A5A5]/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-[#D4A5A5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#5A4A4A]">Prayer Wall</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#9CAF88]/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-[#9CAF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#5A4A4A]">Community</p>
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}