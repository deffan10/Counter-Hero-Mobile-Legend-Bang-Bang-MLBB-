'use client';

import { useEffect, useState } from 'react';
import { getScrapeLogs, triggerScrape } from '@/lib/admin-api';

interface ScrapeLog {
  id: string;
  source: string;
  jobType: string;
  status: string;
  recordsAffected: number;
  duration: number | null;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

interface LogsResponse {
  data: ScrapeLog[];
  total: number;
  page: number;
  perPage: number;
}

const JOB_TYPES = ['heroes', 'stats', 'items', 'spells', 'counters'];

export default function ScrapeLogsPage() {
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState<string | null>(null);

  const perPage = 15;

  const fetchLogs = async (p: number) => {
    try {
      setLoading(true);
      const result = await getScrapeLogs(p, perPage);
      setLogs(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scrape logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const handleTrigger = async (jobType: string) => {
    try {
      setTriggerLoading(jobType);
      setShowDropdown(false);
      await triggerScrape(jobType);
      await fetchLogs(page);
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

  const totalPages = logs ? Math.ceil(logs.total / perPage) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Scrape Logs</h1>
          <p className="text-gray-400 mt-1">View and manage scrape job history</p>
        </div>

        {/* Trigger Scrape Button */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={triggerLoading !== null}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {triggerLoading ? `Triggering ${triggerLoading}...` : 'Trigger Scrape ▾'}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
              {JOB_TYPES.map((jobType) => (
                <button
                  key={jobType}
                  onClick={() => handleTrigger(jobType)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white capitalize first:rounded-t-lg last:rounded-b-lg transition-colors"
                >
                  {jobType}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-gray-800/60 backdrop-blur border border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading scrape logs...</div>
        ) : !logs?.data?.length ? (
          <div className="p-8 text-center text-gray-400">No scrape logs found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700 bg-gray-800/40">
                    <th className="text-left py-3 px-4">ID</th>
                    <th className="text-left py-3 px-4">Source</th>
                    <th className="text-left py-3 px-4">Job Type</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Records</th>
                    <th className="text-left py-3 px-4">Duration</th>
                    <th className="text-left py-3 px-4">Started At</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.data.map((log) => (
                    <tr key={log.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                      <td className="py-3 px-4 text-gray-400 font-mono text-xs">
                        {log.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4 text-gray-300">{log.source}</td>
                      <td className="py-3 px-4 text-white capitalize">{log.jobType}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{log.recordsAffected}</td>
                      <td className="py-3 px-4 text-gray-300">
                        {log.duration ? `${(log.duration / 1000).toFixed(1)}s` : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(log.startedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  Page {page} of {totalPages} ({logs.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-gray-300 rounded text-sm transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-gray-300 rounded text-sm transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
