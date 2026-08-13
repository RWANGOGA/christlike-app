'use client';
import { MessageCircle, Mail, Phone, Heart } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const phoneNumber = '+256756348528';
  const emailAddress = 'akandwanahojonan256@gmail.com';
  const whatsappLink = `https://wa.me/256756348528?text=${encodeURIComponent('Hello! I have a message for Christ-Like.')}`;

  return (
    <div className="min-h-screen bg-[#F5EFE6] py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl text-[#5A4A4A] mb-4">
            Get in Touch
          </h1>
          <p className="text-[#5A4A4A]/70 text-lg max-w-2xl mx-auto">
            We'd love to hear from you. Whether you have questions, suggestions, or just want to share your story, we're here for you.
          </p>
        </div>

        {/* Main Contact Cards */}
        <div className="space-y-8">
          {/* Top Card - Send a Message (WhatsApp) */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center max-w-3xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-[#9CAF88] flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MessageCircle className="w-10 h-10 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl text-[#5A4A4A] mb-4">
              Send us a message
            </h2>
            <p className="text-[#5A4A4A]/70 text-base md:text-lg mb-8 leading-relaxed">
              Click the button below to send us a message via WhatsApp - we'd love to hear from you!
            </p>
            <Link
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#9CAF88] text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-[#8a9c76] transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Send a message
            </Link>
          </div>

          {/* Bottom Cards - Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Email Card */}
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-[#9CAF88] flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Mail className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-xl md:text-2xl text-[#5A4A4A] mb-4">
                Send us an email
              </h2>
              <p className="text-[#5A4A4A]/70 text-sm md:text-base mb-4 leading-relaxed">
                If you'd like to email us, here's our address:
              </p>
              <a
                href={`mailto:${emailAddress}`}
                className="text-[#D4A5A5] hover:text-[#C99595] font-semibold text-sm md:text-base transition underline underline-offset-2 break-all"
              >
                {emailAddress}
              </a>
            </div>

            {/* Phone Card */}
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-[#9CAF88] flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Phone className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-xl md:text-2xl text-[#5A4A4A] mb-4">
                Give us a call
              </h2>
              <p className="text-[#5A4A4A]/70 text-sm md:text-base mb-4 leading-relaxed">
                If you're considering Christ-Like, we'd love to hear from you.
              </p>
              <p className="text-[#5A4A4A] font-semibold text-base md:text-lg">
                Simply call or WhatsApp us on:
              </p>
              <a
                href={`tel:${phoneNumber}`}
                className="text-[#D4A5A5] hover:text-[#C99595] font-semibold text-lg md:text-xl transition underline underline-offset-2 mt-2 block"
              >
                {phoneNumber}
              </a>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-16 text-center max-w-3xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-[#5A4A4A]/5">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-[#D4A5A5]" fill="currentColor" />
              <span className="font-[family-name:var(--font-display)] text-xl text-[#5A4A4A]">
                We're Here to Help
              </span>
            </div>
            <p className="text-[#5A4A4A]/70 leading-relaxed">
              Whether you need technical support, want to share how Christ-Like has impacted your spiritual journey, 
              or have questions about our mission - we're here to support you every step of the way.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}