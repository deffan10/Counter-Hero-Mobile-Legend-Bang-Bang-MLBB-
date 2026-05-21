import Link from 'next/link';
import { getHeroes } from '@/lib/api';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Heroes',
  description: 'Complete list of Mobile Legends heroes with roles, lanes, and stats.',
};

export default async function HeroesPage() {
  let heroesData: any = { data: [], meta: {} };

  try {
    heroesData = await getHeroes();
  } catch {
    // API not available, show empty state
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">All Heroes</h1>

      {heroesData.data.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg">
            No heroes data available yet. Data will appear once scraping is configured.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {heroesData.data.map((hero: any) => (
            <Link key={hero.id} href={`/heroes/${hero.slug}`} className="card text-center group">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-700 flex items-center justify-center">
                {hero.iconUrl ? (
                  <img src={hero.iconUrl} alt={hero.name} className="w-14 h-14 rounded-full" />
                ) : (
                  <span className="text-2xl">{hero.name[0]}</span>
                )}
              </div>
              <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{hero.name}</h3>
              <p className="text-xs text-gray-500">{hero.role}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
