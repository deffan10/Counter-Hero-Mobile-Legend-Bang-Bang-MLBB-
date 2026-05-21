import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'MLBB Counter Hero - Mobile Legends Counter Pick Guide',
    template: '%s | MLBB Counter Hero',
  },
  description:
    'Find the best counter picks for Mobile Legends: Bang Bang heroes. Tier list, item builds, battle spells, win rates, and team combos updated daily.',
  keywords: ['MLBB', 'Mobile Legends', 'counter hero', 'tier list', 'build', 'meta'],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'MLBB Counter Hero',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-mlbb-dark text-white min-h-screen antialiased">{children}</body>
    </html>
  );
}
