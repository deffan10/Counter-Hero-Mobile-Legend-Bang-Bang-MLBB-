import { getTierList } from '@/lib/api';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tier List',
  description: 'MLBB hero tier list berdasarkan meta terbaru. Updated daily.',
};

const tierColors: Record<string, string> = {
  'S+': 'bg-yellow-500 text-black',
  S: 'bg-orange-500 text-white',
  A: 'bg-green-500 text-white',
  B: 'bg-blue-500 text-white',
  C: 'bg-gray-500 text-white',
  D: 'bg-red-500 text-white',
};

export default async function TierListPage() {
  let tierData: any = { data: [] };

  try {
    tierData = await getTierList();
  } catch {
    // API not available
  }

  // Group by tier
  const grouped = tierData.data.reduce((acc: any, entry: any) => {
    const tier = entry.tier;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(entry);
    return acc;
  }, {});

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Tier List</h1>

      {tierData.data.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg">
            Tier list data not available yet. Will be populated once scraping is running.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {['S+', 'S', 'A', 'B', 'C', 'D'].map((tier) =>
            grouped[tier] ? (
              <div key={tier} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`tier-badge ${tierColors[tier]}`}>{tier}</span>
                  <span className="text-gray-400 text-sm">{grouped[tier].length} heroes</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {grouped[tier].map((entry: any) => (
                    <div key={entry.id} className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
                      <span className="font-medium text-sm">{entry.hero?.name || `Hero #${entry.heroId}`}</span>
                      {entry.hero?.role && <span className="text-xs text-gray-400">{entry.hero.role}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : null,
          )}
        </div>
      )}
    </main>
  );
}
