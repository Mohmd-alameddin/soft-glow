
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Soft Glow | Handmade with Love',
  description:
    'Handmade candles, gypsum and concrete decor, and personalized gifts in Lebanon.',

  manifest: '/manifest.webmanifest',

  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Soft Glow',
  },

  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
