'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Home, BookOpen, Sun, Mic, Lightbulb, Heart, LogOut, Settings, FileText, Menu, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/bible', label: 'Read Bible', icon: BookOpen },
    { href: '/devotions', label: 'Daily Devotions', icon: Sun },
    { href: '/sermons', label: 'Sermon Series', icon: Mic },
    { href: '/facts', label: 'Facts for Faith', icon: Lightbulb },
    { href: '/prayer', label: 'Prayer Wall', icon: Heart },
    { href: '/notes', label: 'My Notes', icon: FileText },
    { href: '/leaderboard', label: 'Leaderboard', icon: Heart },
  ];

  const handleLogout = () => {
    api.logout();
    router.push('/');
  };

  const handleNavClick = () => setIsOpen(false);

  return (
    <>
      {/* Mobile top bar with hamburger toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#23213A] flex items-center justify-between px-4 z-40">
        <Link
          href="/?view=home"
          className="font-[family-name:var(--font-display)] text-lg text-[#FBF7EE] tracking-wide"
        >
          CHRIST-LIKE
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[#FBF7EE] p-2"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop overlay when open on mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar itself */}
      <aside
        className={`w-64 bg-[#23213A] h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo (hidden on mobile since top bar already shows it) */}
        <div className="hidden md:block p-6 border-b border-[#FBF7EE]/10">
          <Link
            href="/?view=home"
            className="font-[family-name:var(--font-display)] text-xl text-[#FBF7EE] tracking-wide hover:text-[#E3A857] transition"
          >
            CHRIST-LIKE
          </Link>
          <p className="text-xs text-[#FBF7EE]/40 mt-1">Discipleship Platform</p>
        </div>

        {/* Spacer to push nav below mobile top bar */}
        <div className="md:hidden h-14" />

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#E3A857]/10 text-[#E3A857]'
                    : 'text-[#FBF7EE]/60 hover:bg-[#FBF7EE]/5 hover:text-[#FBF7EE]'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Home, Settings & Logout */}
        <div className="p-4 border-t border-[#FBF7EE]/10 space-y-1">
          <Link
            href="/?view=home"
            onClick={handleNavClick}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#FBF7EE]/60 hover:bg-[#FBF7EE]/5 hover:text-[#FBF7EE] transition-colors"
          >
            <Home className="w-5 h-5" strokeWidth={1.5} /> Back to Home
          </Link>

          <Link
            href="/settings"
            onClick={handleNavClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/settings'
                ? 'bg-[#E3A857]/10 text-[#E3A857]'
                : 'text-[#FBF7EE]/60 hover:bg-[#FBF7EE]/5 hover:text-[#FBF7EE]'
            }`}
          >
            <Settings className="w-5 h-5" strokeWidth={1.5} /> Account Settings
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#FBF7EE]/60 hover:bg-[#FBF7EE]/5 hover:text-[#FBF7EE] transition-colors"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}