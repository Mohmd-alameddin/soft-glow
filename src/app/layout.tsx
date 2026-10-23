
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
    icon: [
      {
        url: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: '/icons/apple-touch-icon.png',
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
