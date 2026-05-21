export type HeroRole = 'Tank' | 'Fighter' | 'Assassin' | 'Mage' | 'Marksman' | 'Support';
export type HeroLane = 'Gold' | 'Exp' | 'Mid' | 'Roam' | 'Jungle';
export type RankTier = 'All' | 'Mythic' | 'Legend' | 'Epic' | 'Grandmaster';
export type TierRank = 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';

export interface Hero {
  id: number;
  name: string;
  slug: string;
  role: HeroRole;
  specialty: string | null;
  difficulty: number;
  imageUrl: string | null;
  iconUrl: string | null;
  lore: string | null;
  lane: HeroLane | null;
  releaseDate: string | null;
  isActive: boolean;
}

export interface HeroCounter {
  id: number;
  heroId: number;
  counterId: number;
  effectiveness: number;
  explanation: string | null;
  tips: string | null;
  counterHero?: Hero;
}

export interface HeroStats {
  id: number;
  heroId: number;
  winrate: number;
  pickrate: number;
  banrate: number;
  rankTier: RankTier;
  patchVersion: string | null;
  recordedAt: string;
}

export interface TierListEntry {
  id: number;
  heroId: number;
  tier: TierRank;
  rankTier: RankTier;
  roleContext: string | null;
  patchVersion: string | null;
  reasoning: string | null;
  hero?: Hero;
}

export interface HeroCombo {
  id: number;
  name: string;
  description: string | null;
  strategy: string | null;
  difficulty: number;
  synergyScore: number;
  heroes?: Hero[];
}
