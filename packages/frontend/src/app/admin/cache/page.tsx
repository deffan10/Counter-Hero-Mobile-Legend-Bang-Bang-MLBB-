'use client';

import { useEffect, useState } from 'react';
import { getCacheStats, flushCache } from '@/lib/admin-api';

interface CacheStatsData {
  usedMemory: string;
  totalKeys: number;
  connectedClients: number;
  hitRate: number | null;
  missRate: number | null;
}

const CACHE_PATTERNS = [
  { label: 'All Heroes', pattern: 'mlbb:v1:heroes:*' },
  { label: 'All Items', pattern: 'mlbb:v1:items:*' },
  { label: 'All Counters', pattern: 'mlbb:v1:counters:*' },
  { label: 'All Spells', pattern: 'mlbb:v1:spells:*' },
  { label: 'All Stats', pattern: 'mlbb:v1:stats:*' },
  { label: 'Tier List', pattern: 'mlbb:v1:tier-list:*' },
  { label: 'All Cache', pattern: 'mlbb:v1:*' },
];

export default function CacheStatsPage() {
  const [stats, setStats] = useState<CacheStatsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [flushingPattern, setFlushingPattern] = useState<string | null>(null);
  const [flushResult, setFlushResult] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const result = await getCacheStats();
      setStats(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cache stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFlush = async (pattern: string) => {
    try {
      setFlushingPattern(pattern);
      setFlushResult(null);
      const result = await flushCache(pattern);
      setFlushResult(`Flushed ${result.deletedCount} keys matching: ${result.pattern}`);
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to flush cache');
    } finally {
      setFlushingPattern(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Cache Stats</h1>
        <p className="text-gray-400 mt-1">Monitor and manage Redis cache</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {flushResult && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400">
          {flushResult}
        </div>
      )}

      {/* Redis Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/60 backdrop-blur border border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-400">Used Memory</p>
          <p className="text-2xl font-bold text-white mt-1">
            {loading ? '...' : stats?.usedMemory ?? 'N/A'}
          </p>
        </div>
        <div className="bg-gray-800/60 backdrop-blur border border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-400">Total Keys</p>
          <p className="text-2xl font-bold text-white mt-1">
            {loading ? '...' : stats?.totalKeys ?? 0}
          </p>
        </div>
        <div className="bg-gray-800/60 backdrop-blur border border-gray-700 rounded-xl p-5">
          <p className="text-sm text-gray-400">Connected Clients</p>
          <p className="text-2xl font-bold text-white mt-1">
            {loading ? '...' : stats?.connectedClients ?? 0}
          </p>
        </div>
      </div>

      {/* Hit/Miss Rates */}
      <div className="bg-gray-800/60 backdrop-blur border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Cache Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-2">Hit Rate</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${stats?.hitRate ?? 0}%` }}
                />
              </div>
              <span className="text-green-400 font-medium text-sm">
                {stats?.hitRate != null ? `${stats.hitRate}%` : 'N/A'}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Miss Rate</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-700 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full transition-all"
                  style={{ width: `${stats?.missRate ?? 0}%` }}
                />
              </div>
              <span className="text-red-400 font-medium text-sm">
                {stats?.missRate != null ? `${stats.missRate}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Flush Cache Patterns */}
      <div className="bg-gray-800/60 backdrop-blur border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Flush Cache</h2>
        <p className="text-sm text-gray-400 mb-4">
          Invalidate cached data by pattern. Use with caution in production.
        </p>
        <div className="space-y-3">
          {CACHE_PATTERNS.map(({ label, pattern }) => (
            <div
              key={pattern}
              className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-700/50"
            >
              <div>
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-gray-400 text-xs font-mono">{pattern}</p>
              </div>
              <button
                onClick={() => handleFlush(pattern)}
                disabled={flushingPattern !== null}
                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 disabled:bg-gray-700 border border-red-500/30 text-red-400 disabled:text-gray-500 rounded-lg text-xs font-medium transition-colors"
              >
                {flushingPattern === pattern ? 'Flushing...' : 'Flush'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
