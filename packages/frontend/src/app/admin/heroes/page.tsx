'use client';

import { useEffect, useState } from 'react';

interface Hero {
  id: string;
  name: string;
  slug: string;
  role: string;
  specialty: string;
  imageUrl: string | null;
}

export default function AdminHeroesPage() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';
        const res = await fetch(`${API_BASE}/heroes?perPage=200`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const data = await res.json();
        setHeroes(Array.isArray(data) ? data : data.data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch heroes');
      } finally {
        setLoading(false);
      }
    };

    fetchHeroes();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Heroes</h1>
        <p className="text-gray-400 mt-1">Manage hero data ({heroes.length} heroes)</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="bg-gray-800/60 backdrop-blur border border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading heroes...</div>
        ) : !heroes.length ? (
          <div className="p-8 text-center text-gray-400">No heroes found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700 bg-gray-800/40">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Slug</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Specialty</th>
                </tr>
              </thead>
              <tbody>
                {heroes.map((hero) => (
                  <tr key={hero.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                    <td className="py-3 px-4 text-white font-medium">{hero.name}</td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">{hero.slug}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                        {hero.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{hero.specialty || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
