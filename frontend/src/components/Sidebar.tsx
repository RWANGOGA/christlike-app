'use client';
import Link from 'next/link';
import { Home, BookOpen, Sun, Mic, Lightbulb, Heart, LogOut, Settings, FileText } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { api } from '@/lib/api';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

 const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/bible', label: 'Read Bible', icon: BookOpen },
  { href: '/devotions', label: 'Daily Devotions', icon: Sun },
  { href: '/sermons', label: 'Sermon Series', icon: Mic },
  { href: '/facts', label: 'Facts for Faith', icon: Lightbulb },
  { href: '/prayer', label: 'Prayer Wall', icon: Heart },
  { href: '/notes', label: 'My Notes', icon: FileText },  // 👈 ADD THIS LINE
];

  const handleLogout = () => {
    api.logout();
    router.push('/');
  };

  return (
    <aside className="w-64 bg-[#23213A] h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#FBF7EE]/10">
        <h1 className="font-[family-name:var(--font-display)] text-xl text-[#FBF7EE] tracking-wide">
          CHRIST-LIKE
        </h1>
        <p className="text-xs text-[#FBF7EE]/40 mt-1">Discipleship Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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

      {/* Footer / Settings & Logout */}
      <div className="p-4 border-t border-[#FBF7EE]/10 space-y-1">
        {/* 👇 NEW: Added Settings Link */}
        <Link 
          href="/settings" 
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
  );
}