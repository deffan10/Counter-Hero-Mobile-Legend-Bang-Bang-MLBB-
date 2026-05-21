'use client';

import { useEffect, useState } from 'react';
import { getScraperStatus, triggerScrape } from '@/lib/admin-api';

interface DashboardData {
  totalHeroes: number;
  totalItems: number;
  totalSpells: number;
  activeJobs: number;
  recentLogs: Array<{
    id: string;
    source: string;
    jobType: string;
    status: string;
    recordsAffected: number;
    duration: number | null;
    startedAt: string;
  }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getScraperStatus();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriggerScrape = async (jobType: string) => {
    try {
      setTriggerLoading(jobType);
      await triggerScrape(jobType);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to trigger ${jobType} scrape`);
    } finally {
      setTriggerLoading(null);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'running': return 'bg-blue-500/20 text-blue-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">System overview and quick actions</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Heroes"
          value={loading ? '...' : data?.totalHeroes ?? 0}
          icon="🦸"
        />
        <StatCard
          label="Total Items"
          value={loading ? '...' : data?.totalItems ?? 0}
          icon="🎒"
        />
        <StatCard
          label="Total Spells"
          value={loading ? '...' : data?.totalSpells ?? 0}
          icon="✨"
        />
        <StatCard
          label="Active Jobs"
          value={loading ? '...' : data?.activeJobs ?? 0}
          icon="⚡"
          highlight={!!data?.activeJobs}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800/60 backdrop-blur border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {['heroes', 'stats', 'items'].map((jobType) => (
            <button
              key={jobType}
              onClick={() => handleTriggerScrape(jobType)}
              disabled={triggerLoading !== null}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              {triggerLoading === jobType ? 'Triggering...' : `Scrape ${jobType}`}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Scrape Logs */}
      <div className="bg-gray-800/60 backdrop-blur border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Scrape Logs</h2>
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : !data?.recentLogs?.length ? (
          <p className="text-gray-400">No recent scrape logs available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 px-3">Job Type</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Records</th>
                  <th className="text-left py-2 px-3">Duration</th>
                  <th className="text-left py-2 px-3">Started</th>
                </tr>
              </thead>
              <tbody>
                {data.recentLogs.slice(0, 5).map((log) => (
                  <tr key={log.id} className="border-b border-gray-700/50">
                    <td className="py-2 px-3 text-white capitalize">{log.jobType}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-300">{log.recordsAffected}</td>
                    <td className="py-2 px-3 text-gray-300">
                      {log.duration ? `${(log.duration / 1000).toFixed(1)}s` : '-'}
                    </td>
                    <td className="py-2 px-3 text-gray-400">
                      {new Date(log.startedAt).toLocaleString()}
                    </td>
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

function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string | number;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-gray-800/60 backdrop-blur border rounded-xl p-5 ${
      highlight ? 'border-blue-500/50' : 'border-gray-700'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
