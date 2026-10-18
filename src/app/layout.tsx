import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Soft Glow | Handmade with Love', description: 'Handmade candles, gypsum and concrete decor, and personalized gifts in Lebanon.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html> }
