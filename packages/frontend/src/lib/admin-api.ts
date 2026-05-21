const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

async function adminFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      ...options,
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  } catch (error) {
    console.error(`Admin API error [${endpoint}]:`, error);
    throw error;
  }
}

// Scraper
export const getScraperStatus = () =>
  adminFetch<{
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
  }>('/admin/scrape/status');

export const getScrapeLogs = (page = 1, perPage = 20) =>
  adminFetch<{
    data: Array<{
      id: string;
      source: string;
      jobType: string;
      status: string;
      recordsAffected: number;
      duration: number | null;
      startedAt: string;
      completedAt: string | null;
      error: string | null;
    }>;
    total: number;
    page: number;
    perPage: number;
  }>(`/admin/scrape/logs?page=${page}&perPage=${perPage}`);

export const triggerScrape = (jobType: string) =>
  adminFetch<{ message: string; jobId: string }>(`/admin/scrape/trigger/${jobType}`, {
    method: 'POST',
  });

// Cache
export const getCacheStats = () =>
  adminFetch<{
    usedMemory: string;
    totalKeys: number;
    connectedClients: number;
    hitRate: number | null;
    missRate: number | null;
  }>('/admin/cache/stats');

export const flushCache = (pattern: string) =>
  adminFetch<{ deletedCount: number; pattern: string }>(`/admin/cache/flush/${encodeURIComponent(pattern)}`, {
    method: 'POST',
  });
