'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

// Routes that belong to the authenticated app (not the public marketing site).
// The Header should never render on these — Sidebar handles navigation there instead.
const APP_ROUTES = [
  '/dashboard',
  '/admin',
  '/bible',
  '/devotions',
  '/sermons',
  '/facts',
  '/prayer',
  '/notes',
  '/leaderboard',
  '/settings',
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Hide header on any authenticated app route (including sub-routes)
  if (APP_ROUTES.some((route) => pathname?.startsWith(route))) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/features', label: 'Features' },
    { href: '/contact', label: 'Contact' },
  ];

  // Handle Sign Up - navigate to home with signup modal
  const handleSignUp = () => {
    window.location.href = '/?modal=signup';
    setIsMenuOpen(false);
  };

  // Handle Sign In - navigate to home with login modal
  const handleSignIn = () => {
    window.location.href = '/?modal=login';
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5EFE6]/95 backdrop-blur-md border-b border-[#5A4A4A]/10">
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-[family-name:var(--font-display)] text-2xl text-[#5A4A4A] tracking-wide">
            Christ-Like
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition ${
                  pathname === link.href
                    ? 'text-[#D4A5A5]'
                    : 'text-[#5A4A4A]/70 hover:text-[#5A4A4A]'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Auth Buttons */}
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-[#5A4A4A]/10">
              <button
                onClick={handleSignIn}
                className="text-sm font-medium text-[#5A4A4A] hover:text-[#D4A5A5] transition"
              >
                Sign In
              </button>
              <button
                onClick={handleSignUp}
                className="px-6 py-2.5 rounded-full bg-[#D4A5A5] text-white text-sm font-medium hover:bg-[#C99595] transition shadow-lg shadow-[#D4A5A5]/30"
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-[#5A4A4A]"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-[#5A4A4A]/10 pt-4">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-sm font-medium transition ${
                    pathname === link.href
                      ? 'text-[#D4A5A5]'
                      : 'text-[#5A4A4A]/70 hover:text-[#5A4A4A]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Auth Buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t border-[#5A4A4A]/10">
                <button
                  onClick={handleSignIn}
                  className="text-center text-sm font-medium text-[#5A4A4A] hover:text-[#D4A5A5] transition py-2"
                >
                  Sign In
                </button>
                <button
                  onClick={handleSignUp}
                  className="px-6 py-3 rounded-full bg-[#D4A5A5] text-white text-sm font-medium hover:bg-[#C99595] transition shadow-lg shadow-[#D4A5A5]/30 text-center"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}