'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  
  // Hide footer on dashboard and admin pages to keep the app UI clean
  if (
    pathname === '/dashboard' || 
    pathname === '/admin' || 
    pathname?.startsWith('/admin/') || 
    pathname?.startsWith('/dashboard/')
  ) {
    return null;
  }

  // Automatically gets the current year from the user's browser
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#5A4A4A]/10 py-10 bg-[#F5EFE6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        
        {/* Brand Name */}
        <p className="font-[family-name:var(--font-display)] text-xl text-[#5A4A4A] mb-2">
          Christ-Like
        </p>
        
        {/* Copyright with Auto-updating Year */}
        <p className="text-sm text-[#5A4A4A]/60">
          © {currentYear} Christ-Like. Helping believers grow closer to Christ.
        </p>
        
      </div>
    </footer>
  );
}