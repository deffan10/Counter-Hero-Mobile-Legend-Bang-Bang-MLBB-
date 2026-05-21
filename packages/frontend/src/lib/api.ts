const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

interface FetchOptions {
  cache?: RequestCache;
  revalidate?: number;
}

async function fetchApi<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: options?.cache,
    next: options?.revalidate ? { revalidate: options.revalidate } : undefined,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// Heroes
export const getHeroes = (params?: string) =>
  fetchApi(`/heroes${params ? `?${params}` : ''}`, { revalidate: 3600 });

export const getHeroBySlug = (slug: string) =>
  fetchApi(`/heroes/${slug}`, { revalidate: 7200 });

export const searchHeroes = (q: string) =>
  fetchApi(`/heroes/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });

// Counters
export const getCounters = (heroSlug: string) =>
  fetchApi(`/counters/${heroSlug}`, { revalidate: 1800 });

// Items
export const getItems = (type?: string) =>
  fetchApi(`/items${type ? `?type=${type}` : ''}`, { revalidate: 21600 });

// Spells
export const getSpells = () =>
  fetchApi('/spells', { revalidate: 43200 });

// Stats
export const getWinrate = (rank?: string) =>
  fetchApi(`/stats/winrate${rank ? `?rank=${rank}` : ''}`, { revalidate: 900 });

// Tier List
export const getTierList = (rank?: string, role?: string) => {
  const params = new URLSearchParams();
  if (rank) params.set('rank', rank);
  if (role) params.set('role', role);
  const qs = params.toString();
  return fetchApi(`/tier-list${qs ? `?${qs}` : ''}`, { revalidate: 3600 });
};

// Combos
export const getCombos = () =>
  fetchApi('/combos', { revalidate: 7200 });
