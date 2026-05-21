export type ItemType = 'Attack' | 'Magic' | 'Defense' | 'Movement' | 'Jungle' | 'Roam';

export interface Item {
  id: number;
  name: string;
  slug: string;
  type: ItemType;
  category: string | null;
  price: number;
  stats: Record<string, number> | null;
  passiveName: string | null;
  passiveDescription: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

export interface BattleSpell {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  cooldown: number | null;
  unlockLevel: number | null;
  imageUrl: string | null;
  isActive: boolean;
}

export interface HeroBuild {
  id: number;
  heroId: number;
  buildName: string;
  buildType: string;
  description: string | null;
  winrate: number | null;
  popularity: number | null;
  items?: Item[];
}
