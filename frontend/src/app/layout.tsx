// frontend/src/app/layout.tsx
import { Spectral, Inter } from 'next/font/google';
import './globals.css';

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
    url: 'https://christlike.app', // Change to your real domain later
    siteName: 'CHRIST-LIKE',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80', // Beautiful cross image
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
        className={`${spectral.variable} ${inter.variable} font-sans`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}