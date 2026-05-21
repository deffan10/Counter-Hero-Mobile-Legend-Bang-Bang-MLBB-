import Link from 'next/link';

const features = [
  { title: 'Counter Hero', href: '/counter', desc: 'Cari counter terbaik untuk setiap hero', icon: 'shield' },
  { title: 'Tier List', href: '/tier-list', desc: 'Tier list hero berdasarkan meta terbaru', icon: 'trophy' },
  { title: 'Hero List', href: '/heroes', desc: 'Semua hero dengan detail lengkap', icon: 'users' },
  { title: 'Item Build', href: '/items', desc: 'Panduan item build populer', icon: 'package' },
  { title: 'Statistics', href: '/stats', desc: 'Win rate, pick rate, ban rate', icon: 'chart' },
  { title: 'Combo Hero', href: '/combos', desc: 'Rekomendasi komposisi tim terbaik', icon: 'link' },
];

export default function HomePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          MLBB Counter Hero
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
          Platform terlengkap untuk counter pick, tier list, dan strategi Mobile Legends: Bang Bang.
          Data diupdate otomatis setiap hari.
        </p>
      </section>

      {/* Search */}
      <section className="max-w-xl mx-auto mb-16">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari hero... (contoh: Fanny, Ling, Beatrix)"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-5 py-4 text-lg focus:outline-none focus:border-primary transition-colors placeholder:text-gray-500"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link key={feature.href} href={feature.href} className="card group">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
              {feature.title}
            </h3>
            <p className="text-gray-400">{feature.desc}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
