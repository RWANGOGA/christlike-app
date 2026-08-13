// frontend/src/app/layout.tsx
import { Spectral, Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer'; // 👈 Import the new Footer

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
        // 👇 Added flex flex-col min-h-screen so the footer pushes to the bottom
        className={`${spectral.variable} ${inter.variable} font-sans bg-[#F5EFE6] flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        {/* Header is fixed at the top */}
        <Header />
        
        {/* 👇 Main wrapper grows to fill available space */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer sits at the bottom */}
        <Footer />
      </body>
    </html>
  );
}