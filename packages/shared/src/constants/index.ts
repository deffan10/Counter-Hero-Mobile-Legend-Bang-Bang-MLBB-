export const HERO_ROLES = ['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'] as const;
export const HERO_LANES = ['Gold', 'Exp', 'Mid', 'Roam', 'Jungle'] as const;
export const RANK_TIERS = ['All', 'Mythic', 'Legend', 'Epic', 'Grandmaster'] as const;
export const TIER_RANKS = ['S+', 'S', 'A', 'B', 'C', 'D'] as const;
export const ITEM_TYPES = ['Attack', 'Magic', 'Defense', 'Movement', 'Jungle', 'Roam'] as const;

export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const CACHE_TTL = {
  HERO_LIST: 3600,        // 1 hour
  HERO_DETAIL: 7200,      // 2 hours
  COUNTER_DATA: 1800,     // 30 min
  STATS: 900,             // 15 min
  TIER_LIST: 3600,        // 1 hour
  ITEMS: 21600,           // 6 hours
  SPELLS: 43200,          // 12 hours
  COMBOS: 7200,           // 2 hours
  SEARCH: 600,            // 10 min
} as const;
