// frontend/src/app/layout.tsx
import { Spectral, Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';

const spectral = Spectral({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata = {
  title: 'CHRIST-LIKE | Become More Like Jesus',
  description: 'A comprehensive digital companion designed to guide your spiritual growth. Immerse yourself in Scripture, track your discipleship journey, and connect with a community of faith.',
  openGraph: {
    title: 'CHRIST-LIKE | Become More Like Jesus',
    description: 'Read Scripture, track your discipleship journey, and connect with a community of faith.',
    url: 'https://christlike.app', 
    siteName: 'CHRIST-LIKE',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80', 
        width: 1200,
        height: 630,
        alt: 'CHRIST-LIKE App Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spectral.variable} ${inter.variable} font-sans bg-[#F5EFE6]`}
        suppressHydrationWarning
      >
        {/* 
          Header is fixed (position: fixed). 
          It automatically hides itself on /admin and /dashboard routes.
        */}
        <Header />
        
        {/* 
          Render children directly without a global pt-20 wrapper. 
          - Public pages (Home, About, Features) add their own pt-20 or pt-24.
          - Admin/Dashboard pages don't have the Header, so they don't need the padding.
        */}
        {children}
      </body>
    </html>
  );
}