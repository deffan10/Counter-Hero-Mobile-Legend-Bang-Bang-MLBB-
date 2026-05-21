import { PrismaClient, HeroRole, HeroLane, ItemType, RankTier, Tier, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ============================================================
// HERO DATA
// ============================================================
interface HeroSeed {
  name: string;
  slug: string;
  role: HeroRole;
  lane: HeroLane;
  difficulty: number;
  specialty?: string;
}

const heroes: HeroSeed[] = [
  // === FIGHTERS ===
  { name: 'Chou', slug: 'chou', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 7, specialty: 'Chase/Control' },
  { name: 'Yu Zhong', slug: 'yu-zhong', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 5, specialty: 'Damage/Regen' },
  { name: 'Paquito', slug: 'paquito', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 7, specialty: 'Burst/Chase' },
  { name: 'Thamuz', slug: 'thamuz', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 4, specialty: 'Damage/Regen' },
  { name: 'Freya', slug: 'freya', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 4, specialty: 'Burst/Crowd Control' },
  { name: 'Badang', slug: 'badang', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 5, specialty: 'Burst/Push' },
  { name: 'X.Borg', slug: 'x-borg', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 4, specialty: 'Damage/Regen' },
  { name: 'Aldous', slug: 'aldous', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 3, specialty: 'Burst/Chase' },
  { name: 'Guinevere', slug: 'guinevere', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 6, specialty: 'Burst/Control' },
  { name: 'Silvanna', slug: 'silvanna', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 5, specialty: 'Control/Burst' },
  { name: 'Phoveus', slug: 'phoveus', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 5, specialty: 'Chase/Regen' },
  { name: 'Aulus', slug: 'aulus', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 3, specialty: 'Damage/Push' },
  { name: 'Arlott', slug: 'arlott', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 6, specialty: 'Chase/Burst' },
  { name: 'Dyrroth', slug: 'dyrroth', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 4, specialty: 'Burst/Damage' },
  { name: 'Alpha', slug: 'alpha', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 4, specialty: 'Chase/Damage' },
  { name: 'Zilong', slug: 'zilong', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 3, specialty: 'Chase/Push' },
  { name: 'Balmond', slug: 'balmond', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 2, specialty: 'Damage/Regen' },
  { name: 'Sun', slug: 'sun', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 3, specialty: 'Push/Damage' },
  { name: 'Terizla', slug: 'terizla', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 5, specialty: 'Control/Damage' },
  { name: 'Jawhead', slug: 'jawhead', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 5, specialty: 'Chase/Crowd Control' },
  { name: 'Martis', slug: 'martis', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 5, specialty: 'Chase/Damage' },
  { name: 'Minsitthar', slug: 'minsitthar', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 5, specialty: 'Control/Initiator' },
  { name: 'Khaleed', slug: 'khaleed', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 4, specialty: 'Regen/Poke' },
  { name: 'Lapu-Lapu', slug: 'lapu-lapu', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 5, specialty: 'Burst/Damage' },

  { name: 'Roger', slug: 'roger', role: HeroRole.Fighter, lane: HeroLane.Jungle, difficulty: 6, specialty: 'Burst/Chase' },
  { name: 'Hilda', slug: 'hilda', role: HeroRole.Fighter, lane: HeroLane.Roam, difficulty: 3, specialty: 'Initiator/Burst' },
  { name: 'Argus', slug: 'argus', role: HeroRole.Fighter, lane: HeroLane.Exp, difficulty: 4, specialty: 'Damage/Regen' },

  // === ASSASSINS ===
  { name: 'Fanny', slug: 'fanny', role: HeroRole.Assassin, lane: HeroLane.Jungle, difficulty: 10, specialty: 'Chase/Burst' },
  { name: 'Ling', slug: 'ling', role: HeroRole.Assassin, lane: HeroLane.Jungle, difficulty: 9, specialty: 'Chase/Burst' },
  { name: 'Lancelot', slug: 'lancelot', role: HeroRole.Assassin, lane: HeroLane.Jungle, difficulty: 8, specialty: 'Burst/Chase' },
  { name: 'Hayabusa', slug: 'hayabusa', role: HeroRole.Assassin, lane: HeroLane.Jungle, difficulty: 8, specialty: 'Push/Burst' },
  { name: 'Gusion', slug: 'gusion', role: HeroRole.Assassin, lane: HeroLane.Jungle, difficulty: 9, specialty: 'Burst/Chase' },
  { name: 'Helcurt', slug: 'helcurt', role: HeroRole.Assassin, lane: HeroLane.Jungle, difficulty: 6, specialty: 'Burst/Chase' },
  { name: 'Karina', slug: 'karina', role: HeroRole.Assassin, lane: HeroLane.Jungle, difficulty: 5, specialty: 'Burst/Reap' },
  { name: 'Saber', slug: 'saber', role: HeroRole.Assassin, lane: HeroLane.Jungle, difficulty: 4, specialty: 'Burst/Chase' },
  { name: 'Aamon', slug: 'aamon', role: HeroRole.Assassin, lane: HeroLane.Jungle, difficulty: 6, specialty: 'Burst/Chase' },
  { name: 'Joy', slug: 'joy', role: HeroRole.Assassin, lane: HeroLane.Jungle, difficulty: 7, specialty: 'Chase/Burst' },
  { name: 'Yin', slug: 'yin', role: HeroRole.Assassin, lane: HeroLane.Jungle, difficulty: 5, specialty: 'Chase/Control' },
  { name: 'Benedetta', slug: 'benedetta', role: HeroRole.Assassin, lane: HeroLane.Exp, difficulty: 8, specialty: 'Burst/Chase' },
  { name: 'Natalia', slug: 'natalia', role: HeroRole.Assassin, lane: HeroLane.Roam, difficulty: 7, specialty: 'Burst/Chase' },
  { name: 'Hanzo', slug: 'hanzo', role: HeroRole.Assassin, lane: HeroLane.Jungle, difficulty: 6, specialty: 'Burst/Push' },
  { name: 'Selena', slug: 'selena', role: HeroRole.Assassin, lane: HeroLane.Mid, difficulty: 8, specialty: 'Control/Burst' },


  // === MAGES ===
  { name: 'Valentina', slug: 'valentina', role: HeroRole.Mage, lane: HeroLane.Mid, difficulty: 7, specialty: 'Burst/Morph' },
  { name: 'Yve', slug: 'yve', role: HeroRole.Mage, lane: HeroLane.Mid, difficulty: 6, specialty: 'Poke/Control' },
  { name: 'Kagura', slug: 'kagura', role: HeroRole.Mage, lane: HeroLane.Mid, difficulty: 9, specialty: 'Burst/Poke' },
  { name: 'Lunox', slug: 'lunox', role: HeroRole.Mage, lane: HeroLane.Mid, difficulty: 7, specialty: 'Burst/Damage' },
  { name: 'Pharsa', slug: 'pharsa', role: HeroRole.Mage, lane: HeroLane.Mid, difficulty: 5, specialty: 'Poke/Burst' },
  { name: 'Lylia', slug: 'lylia', role: HeroRole.Mage, lane: HeroLane.Mid, difficulty: 6, specialty: 'Burst/Control' },
  { name: 'Cecilion', slug: 'cecilion', role: HeroRole.Mage, lane: HeroLane.Mid, difficulty: 5, specialty: 'Poke/Burst' },
  { name: 'Vale', slug: 'vale', role: HeroRole.Mage, lane: HeroLane.Mid, difficulty: 5, specialty: 'Burst/Control' },
  { name: 'Xavier', slug: 'xavier', role: HeroRole.Mage, lane: HeroLane.Mid, difficulty: 4, specialty: 'Poke/Burst' },
  { name: 'Zhuxin', slug: 'zhuxin', role: HeroRole.Mage, lane: HeroLane.Mid, difficulty: 6, specialty: 'Burst/Chase' },
  { name: 'Novaria', slug: 'novaria', role: HeroRole.Mage, lane: HeroLane.Mid, difficulty: 6, specialty: 'Poke/Control' },
  { name: 'Eudora', slug: 'eudora', role: HeroRole.Mage, lane: HeroLane.Mid, difficulty: 3, specialty: 'Burst/Poke' },
  { name: 'Aurora', slug: 'aurora', role: HeroRole.Mage, lane: HeroLane.Mid, difficulty: 4, specialty: 'Burst/Control' },
  { name: 'Kadita', slug: 'kadita', role: HeroRole.Mage, lane: HeroLane.Mid, difficulty: 6, specialty: 'Burst/Poke' },
  { name: 'Esmeralda', slug: 'esmeralda', role: HeroRole.Mage, lane: HeroLane.Exp, difficulty: 5, specialty: 'Regen/Damage' },
  { name: 'Harley', slug: 'harley', role: HeroRole.Mage, lane: HeroLane.Jungle, difficulty: 6, specialty: 'Burst/Chase' },
  { name: 'Chang\'e', slug: 'change', role: HeroRole.Mage, lane: HeroLane.Mid, difficulty: 4, specialty: 'Poke/Push' },
  { name: 'Cyclops', slug: 'cyclops', role: HeroRole.Mage, lane: HeroLane.Jungle, difficulty: 4, specialty: 'Burst/Control' },
  { name: 'Nana', slug: 'nana', role: HeroRole.Mage, lane: HeroLane.Mid, difficulty: 3, specialty: 'Control/Poke' },


  // === MARKSMEN ===
  { name: 'Beatrix', slug: 'beatrix', role: HeroRole.Marksman, lane: HeroLane.Gold, difficulty: 8, specialty: 'Burst/Damage' },
  { name: 'Brody', slug: 'brody', role: HeroRole.Marksman, lane: HeroLane.Gold, difficulty: 5, specialty: 'Burst/Poke' },
  { name: 'Wanwan', slug: 'wanwan', role: HeroRole.Marksman, lane: HeroLane.Gold, difficulty: 7, specialty: 'Chase/Burst' },
  { name: 'Claude', slug: 'claude', role: HeroRole.Marksman, lane: HeroLane.Gold, difficulty: 7, specialty: 'Burst/Damage' },
  { name: 'Karrie', slug: 'karrie', role: HeroRole.Marksman, lane: HeroLane.Gold, difficulty: 4, specialty: 'Damage/Burst' },
  { name: 'Moskov', slug: 'moskov', role: HeroRole.Marksman, lane: HeroLane.Gold, difficulty: 5, specialty: 'Damage/Push' },
  { name: 'Lesley', slug: 'lesley', role: HeroRole.Marksman, lane: HeroLane.Gold, difficulty: 4, specialty: 'Burst/Poke' },
  { name: 'Irithel', slug: 'irithel', role: HeroRole.Marksman, lane: HeroLane.Gold, difficulty: 5, specialty: 'Damage/Burst' },
  { name: 'Bruno', slug: 'bruno', role: HeroRole.Marksman, lane: HeroLane.Gold, difficulty: 4, specialty: 'Burst/Damage' },
  { name: 'Miya', slug: 'miya', role: HeroRole.Marksman, lane: HeroLane.Gold, difficulty: 3, specialty: 'Damage/Push' },
  { name: 'Layla', slug: 'layla', role: HeroRole.Marksman, lane: HeroLane.Gold, difficulty: 2, specialty: 'Damage/Poke' },
  { name: 'Hanabi', slug: 'hanabi', role: HeroRole.Marksman, lane: HeroLane.Gold, difficulty: 3, specialty: 'Damage/Control' },
  { name: 'Granger', slug: 'granger', role: HeroRole.Marksman, lane: HeroLane.Jungle, difficulty: 6, specialty: 'Burst/Poke' },
  { name: 'Clint', slug: 'clint', role: HeroRole.Marksman, lane: HeroLane.Gold, difficulty: 4, specialty: 'Burst/Poke' },
  { name: 'Melissa', slug: 'melissa', role: HeroRole.Marksman, lane: HeroLane.Gold, difficulty: 5, specialty: 'Damage/Burst' },
  { name: 'Natan', slug: 'natan', role: HeroRole.Marksman, lane: HeroLane.Gold, difficulty: 6, specialty: 'Burst/Damage' },
  { name: 'Popol and Kupa', slug: 'popol-and-kupa', role: HeroRole.Marksman, lane: HeroLane.Gold, difficulty: 6, specialty: 'Push/Damage' },


  // === TANKS ===
  { name: 'Khufra', slug: 'khufra', role: HeroRole.Tank, lane: HeroLane.Roam, difficulty: 6, specialty: 'Control/Initiator' },
  { name: 'Atlas', slug: 'atlas', role: HeroRole.Tank, lane: HeroLane.Roam, difficulty: 6, specialty: 'Initiator/Control' },
  { name: 'Tigreal', slug: 'tigreal', role: HeroRole.Tank, lane: HeroLane.Roam, difficulty: 4, specialty: 'Initiator/Control' },
  { name: 'Akai', slug: 'akai', role: HeroRole.Tank, lane: HeroLane.Roam, difficulty: 5, specialty: 'Control/Initiator' },
  { name: 'Hylos', slug: 'hylos', role: HeroRole.Tank, lane: HeroLane.Roam, difficulty: 3, specialty: 'Initiator/Regen' },
  { name: 'Franco', slug: 'franco', role: HeroRole.Tank, lane: HeroLane.Roam, difficulty: 7, specialty: 'Control/Initiator' },
  { name: 'Johnson', slug: 'johnson', role: HeroRole.Tank, lane: HeroLane.Roam, difficulty: 5, specialty: 'Initiator/Control' },
  { name: 'Grock', slug: 'grock', role: HeroRole.Tank, lane: HeroLane.Roam, difficulty: 5, specialty: 'Initiator/Push' },
  { name: 'Edith', slug: 'edith', role: HeroRole.Tank, lane: HeroLane.Exp, difficulty: 6, specialty: 'Initiator/Damage' },
  { name: 'Minotaur', slug: 'minotaur', role: HeroRole.Tank, lane: HeroLane.Roam, difficulty: 4, specialty: 'Initiator/Regen' },
  { name: 'Belerick', slug: 'belerick', role: HeroRole.Tank, lane: HeroLane.Roam, difficulty: 3, specialty: 'Damage/Regen' },
  { name: 'Gatotkaca', slug: 'gatotkaca', role: HeroRole.Tank, lane: HeroLane.Roam, difficulty: 5, specialty: 'Initiator/Control' },
  { name: 'Gloo', slug: 'gloo', role: HeroRole.Tank, lane: HeroLane.Roam, difficulty: 6, specialty: 'Chase/Regen' },
  { name: 'Baxia', slug: 'baxia', role: HeroRole.Tank, lane: HeroLane.Roam, difficulty: 5, specialty: 'Chase/Initiator' },
  { name: 'Lolita', slug: 'lolita', role: HeroRole.Tank, lane: HeroLane.Roam, difficulty: 6, specialty: 'Guard/Control' },
  { name: 'Uranus', slug: 'uranus', role: HeroRole.Tank, lane: HeroLane.Exp, difficulty: 3, specialty: 'Regen/Guard' },
  { name: 'Carmilla', slug: 'carmilla', role: HeroRole.Tank, lane: HeroLane.Roam, difficulty: 5, specialty: 'Initiator/Control' },
  { name: 'Chip', slug: 'chip', role: HeroRole.Tank, lane: HeroLane.Roam, difficulty: 4, specialty: 'Support/Initiator' },


  // === SUPPORTS ===
  { name: 'Estes', slug: 'estes', role: HeroRole.Support, lane: HeroLane.Roam, difficulty: 3, specialty: 'Regen/Guard' },
  { name: 'Rafaela', slug: 'rafaela', role: HeroRole.Support, lane: HeroLane.Roam, difficulty: 3, specialty: 'Regen/Poke' },
  { name: 'Angela', slug: 'angela', role: HeroRole.Support, lane: HeroLane.Roam, difficulty: 5, specialty: 'Guard/Regen' },
  { name: 'Mathilda', slug: 'mathilda', role: HeroRole.Support, lane: HeroLane.Roam, difficulty: 6, specialty: 'Chase/Guard' },
  { name: 'Floryn', slug: 'floryn', role: HeroRole.Support, lane: HeroLane.Roam, difficulty: 3, specialty: 'Regen/Poke' },
  { name: 'Diggie', slug: 'diggie', role: HeroRole.Support, lane: HeroLane.Roam, difficulty: 4, specialty: 'Guard/Poke' },
  { name: 'Faramis', slug: 'faramis', role: HeroRole.Support, lane: HeroLane.Roam, difficulty: 5, specialty: 'Regen/Initiator' },
  { name: 'Kaja', slug: 'kaja', role: HeroRole.Support, lane: HeroLane.Roam, difficulty: 4, specialty: 'Chase/Control' },
];



// ============================================================
// BATTLE SPELLS DATA
// ============================================================
interface SpellSeed {
  name: string;
  slug: string;
  description: string;
  cooldown: number;
  unlockLevel: number;
}

const battleSpells: SpellSeed[] = [
  { name: 'Flicker', slug: 'flicker', description: 'Teleport a short distance in a specified direction. Gains a short speed boost after teleporting.', cooldown: 120, unlockLevel: 1 },
  { name: 'Retribution', slug: 'retribution', description: 'Deals 520-1160 true damage to the targeted jungle monster or minion. Must equip jungle item. Can target enemy heroes with upgraded versions.', cooldown: 35, unlockLevel: 1 },
  { name: 'Execute', slug: 'execute', description: 'Deals 200-800 true damage to a designated enemy hero. Damage scales with level.', cooldown: 90, unlockLevel: 1 },
  { name: 'Flameshot', slug: 'flameshot', description: 'Fires a flaming shot in a designated direction, dealing 160-640 magic damage and knocking back enemies.', cooldown: 50, unlockLevel: 1 },
  { name: 'Aegis', slug: 'aegis', description: 'Generates a shield that absorbs 750-1500 damage for self and nearby allies. Lasts 5 seconds.', cooldown: 75, unlockLevel: 1 },
  { name: 'Petrify', slug: 'petrify', description: 'Petrifies surrounding enemies for 0.8 seconds, dealing 100-350 magic damage.', cooldown: 75, unlockLevel: 1 },
  { name: 'Sprint', slug: 'sprint', description: 'Increases movement speed by 50% for 6 seconds. Slowly decays over time.', cooldown: 100, unlockLevel: 1 },
  { name: 'Purify', slug: 'purify', description: 'Immediately removes all debuffs and grants immunity to CC for 1.2 seconds. Increases movement speed by 30%.', cooldown: 90, unlockLevel: 1 },
  { name: 'Inspire', slug: 'inspire', description: 'Increases attack speed by 55% for 5 seconds. Basic attacks ignore 8+target level defense.', cooldown: 75, unlockLevel: 1 },
  { name: 'Revitalize', slug: 'revitalize', description: 'Creates a healing area. Allied heroes in the area recover HP continuously for 4 seconds.', cooldown: 75, unlockLevel: 1 },
  { name: 'Vengeance', slug: 'vengeance', description: 'Deals 50 plus 25% of damage taken as magic damage to attackers for 3 seconds. Reduces damage taken by 35%.', cooldown: 75, unlockLevel: 1 },
  { name: 'Arrival', slug: 'arrival', description: 'Teleport to an allied turret or minion after channeling for 3 seconds. Gain extra movement speed on arrival.', cooldown: 75, unlockLevel: 1 },
];



// ============================================================
// ITEMS DATA
// ============================================================
interface ItemSeed {
  name: string;
  slug: string;
  type: ItemType;
  category: string;
  price: number;
  passiveName?: string;
  passiveDescription?: string;
}

const items: ItemSeed[] = [
  // === ATTACK ITEMS ===
  { name: 'Blade of Despair', slug: 'blade-of-despair', type: ItemType.Attack, category: 'Physical', price: 3010, passiveName: 'Despair', passiveDescription: 'Attacking enemy units that have HP below 50% will increase Physical Attack by 25%.' },
  { name: 'Endless Battle', slug: 'endless-battle', type: ItemType.Attack, category: 'Physical', price: 2470, passiveName: 'Divine Justice', passiveDescription: 'After using a skill, next basic attack deals extra 60% Physical Attack as True Damage.' },
  { name: 'Blade of the Heptaseas', slug: 'blade-of-the-heptaseas', type: ItemType.Attack, category: 'Physical', price: 1950, passiveName: 'Ambush', passiveDescription: 'If no damage is dealt or received within 5s, next basic attack deals extra damage and slows.' },
  { name: 'Berserker\'s Fury', slug: 'berserkers-fury', type: ItemType.Attack, category: 'Physical', price: 2350, passiveName: 'Doom', passiveDescription: 'Crit hits increase Physical Attack by 5% for 2s.' },
  { name: 'Windtalker', slug: 'windtalker', type: ItemType.Attack, category: 'Physical', price: 1820, passiveName: 'Typhoon', passiveDescription: 'Every 4 basic attacks, deal 150-362 Magic Damage to up to 3 enemies.' },
  { name: 'Scarlet Phantom', slug: 'scarlet-phantom', type: ItemType.Attack, category: 'Physical', price: 2020, passiveName: 'Frenzy', passiveDescription: 'Crit hits increase Attack Speed by 30% and Crit Chance by 5% for 2s.' },
  { name: 'Malefic Roar', slug: 'malefic-roar', type: ItemType.Attack, category: 'Physical', price: 2060, passiveName: 'Armor Buster', passiveDescription: 'Each point of enemy Physical Defense gives 0.05% extra Physical Penetration, max 20%.' },
  { name: 'Hunter Strike', slug: 'hunter-strike', type: ItemType.Attack, category: 'Physical', price: 2010, passiveName: 'Retribution', passiveDescription: 'Dealing damage to a target 5 times in a row increases movement speed by 50% for 3s.' },
  { name: 'War Axe', slug: 'war-axe', type: ItemType.Attack, category: 'Physical', price: 2100, passiveName: 'Fighting Spirit', passiveDescription: 'Dealing damage grants 9 Physical Attack and 3 Physical Penetration per stack, max 8 stacks.' },
  { name: 'Haas\'s Claws', slug: 'haass-claws', type: ItemType.Attack, category: 'Physical', price: 1810, passiveName: 'Insanity', passiveDescription: 'When HP drops below 50%, increases Spell Vamp by 15%.' },
  { name: 'Demon Hunter Sword', slug: 'demon-hunter-sword', type: ItemType.Attack, category: 'Physical', price: 2180, passiveName: 'Devour', passiveDescription: 'Basic attacks deal 9% of target current HP as extra Physical Damage.' },


  // === MAGIC ITEMS ===
  { name: 'Holy Crystal', slug: 'holy-crystal', type: ItemType.Magic, category: 'Magic Power', price: 2180, passiveName: 'Mystery', passiveDescription: 'Increases Magic Power by 21-35% scaling with level.' },
  { name: 'Divine Glaive', slug: 'divine-glaive', type: ItemType.Magic, category: 'Magic Power', price: 1970, passiveName: 'Spellbreaker', passiveDescription: 'Each point of enemy Magic Defense increases Magic Penetration by 0.1%, max 20%.' },
  { name: 'Blood Wings', slug: 'blood-wings', type: ItemType.Magic, category: 'Magic Power', price: 3000, passiveName: 'Nirvana', passiveDescription: 'Adds 1.5 HP for every 1 Magic Power. Taking fatal damage grants shield equal to 100% Magic Power.' },
  { name: 'Lightning Truncheon', slug: 'lightning-truncheon', type: ItemType.Magic, category: 'Magic Power', price: 2250, passiveName: 'Resonate', passiveDescription: 'Every 6s, next skill deals extra Magic Damage that bounces to 3 enemies.' },
  { name: 'Clock of Destiny', slug: 'clock-of-destiny', type: ItemType.Magic, category: 'Magic Power', price: 1950, passiveName: 'Time', passiveDescription: 'Gains 25 HP and 4 Magic Power every 20s up to 12 stacks. At max stacks, gain 5% Magic Power and 300 Mana.' },
  { name: 'Glowing Wand', slug: 'glowing-wand', type: ItemType.Magic, category: 'Magic Power', price: 2200, passiveName: 'Scorch', passiveDescription: 'Dealing Magic Damage burns targets for 3s, dealing 1-2% Max HP Magic Damage per second.' },
  { name: 'Genius Wand', slug: 'genius-wand', type: ItemType.Magic, category: 'Magic Power', price: 2000, passiveName: 'Magic', passiveDescription: 'Dealing Magic Damage reduces enemy Magic Defense by 3-7 for 2s, stacks 3 times.' },
  { name: 'Concentrated Energy', slug: 'concentrated-energy', type: ItemType.Magic, category: 'Magic Power', price: 2020, passiveName: 'Recharge', passiveDescription: 'Eliminating an enemy hero recovers 10% HP.' },
  { name: 'Ice Queen Wand', slug: 'ice-queen-wand', type: ItemType.Magic, category: 'Magic Power', price: 2240, passiveName: 'Ice Bound', passiveDescription: 'Skills dealing damage slow enemies by 15% for 3s. Stacks up to 2 times.' },
  { name: 'Starlium Scythe', slug: 'starlium-scythe', type: ItemType.Magic, category: 'Magic Power', price: 2120, passiveName: 'Star Power', passiveDescription: 'After using a skill, next basic attack deals extra Magic Damage equal to 100% Magic Power.' },


  // === DEFENSE ITEMS ===
  { name: 'Immortality', slug: 'immortality', type: ItemType.Defense, category: 'Defense', price: 2120, passiveName: 'Immortal', passiveDescription: 'Resurrect 2.5s after dying with 16% HP and shield. 180s cooldown.' },
  { name: 'Antique Cuirass', slug: 'antique-cuirass', type: ItemType.Defense, category: 'Defense', price: 2170, passiveName: 'Deter', passiveDescription: 'When hit by enemy skill, reduces their Physical Attack by 10% for 2s. Stacks up to 3 times.' },
  { name: 'Athena\'s Shield', slug: 'athenas-shield', type: ItemType.Defense, category: 'Defense', price: 2150, passiveName: 'Shield', passiveDescription: 'Gain a shield every 10s that blocks 500-1150 Magic Damage.' },
  { name: 'Radiant Armor', slug: 'radiant-armor', type: ItemType.Defense, category: 'Defense', price: 1880, passiveName: 'Holy Blessing', passiveDescription: 'Receiving Magic Damage increases Magic Defense by 3-9 per stack, up to 6 stacks.' },
  { name: 'Dominance Ice', slug: 'dominance-ice', type: ItemType.Defense, category: 'Defense', price: 2010, passiveName: 'Arctic Cold', passiveDescription: 'Reduces nearby enemy Shield and HP Regen by 50%, Attack Speed by 30%.' },
  { name: 'Blade Armor', slug: 'blade-armor', type: ItemType.Defense, category: 'Defense', price: 1660, passiveName: 'Counterstrike', passiveDescription: 'Deals 25% of enemy basic attack damage back as Physical Damage.' },
  { name: 'Brute Force Breastplate', slug: 'brute-force-breastplate', type: ItemType.Defense, category: 'Defense', price: 1870, passiveName: 'Brute Force', passiveDescription: 'Using skill or basic attack grants 4% Movement Speed and 5 Physical/Magic Defense. Stacks 4 times.' },
  { name: 'Oracle', slug: 'oracle', type: ItemType.Defense, category: 'Defense', price: 2060, passiveName: 'Bless', passiveDescription: 'Increases Shield absorption and HP regen effects by 30%.' },
  { name: 'Queen\'s Wings', slug: 'queens-wings', type: ItemType.Defense, category: 'Defense', price: 2250, passiveName: 'Demonize', passiveDescription: 'When HP drops below 50%, reduces damage taken by 20% and increases Spell Vamp by 30%.' },
  { name: 'Twilight Armor', slug: 'twilight-armor', type: ItemType.Defense, category: 'Defense', price: 2160, passiveName: 'Defiance', passiveDescription: 'Every 4s, blocks extra damage from next instance exceeding 900 damage.' },


  // === MOVEMENT ITEMS ===
  { name: 'Tough Boots', slug: 'tough-boots', type: ItemType.Movement, category: 'Boots', price: 700, passiveName: 'Fortitude', passiveDescription: 'Reduces CC duration by 30%.' },
  { name: 'Warrior Boots', slug: 'warrior-boots', type: ItemType.Movement, category: 'Boots', price: 720, passiveName: 'Valor', passiveDescription: 'Physical Defense increases by 5 per basic attack received, up to 25.' },
  { name: 'Arcane Boots', slug: 'arcane-boots', type: ItemType.Movement, category: 'Boots', price: 690, passiveName: undefined, passiveDescription: '+10 Magic Penetration' },
  { name: 'Magic Shoes', slug: 'magic-shoes', type: ItemType.Movement, category: 'Boots', price: 710, passiveName: undefined, passiveDescription: '+10% Cooldown Reduction' },
  { name: 'Rapid Boots', slug: 'rapid-boots', type: ItemType.Movement, category: 'Boots', price: 710, passiveName: undefined, passiveDescription: '+80 Movement Speed, reduced when in combat.' },
  { name: 'Swift Boots', slug: 'swift-boots', type: ItemType.Movement, category: 'Boots', price: 710, passiveName: undefined, passiveDescription: '+15% Attack Speed' },

  // === JUNGLE ITEMS ===
  { name: 'Ice Retribution', slug: 'ice-retribution', type: ItemType.Jungle, category: 'Jungle', price: 250, passiveName: 'Ice Retribution', passiveDescription: 'Retribution can slow enemy hero movement speed by 70% and steal 4% Movement Speed for 3s.' },
  { name: 'Flame Retribution', slug: 'flame-retribution', type: ItemType.Jungle, category: 'Jungle', price: 250, passiveName: 'Flame Retribution', passiveDescription: 'Retribution can deal true damage to enemy hero and reduce their Magic Defense and Physical Defense.' },
  { name: 'Bloody Retribution', slug: 'bloody-retribution', type: ItemType.Jungle, category: 'Jungle', price: 250, passiveName: 'Bloody Retribution', passiveDescription: 'Retribution can deal true damage to enemy hero and restore HP.' },

  // === ROAM ITEMS ===
  { name: 'Courage Mask', slug: 'courage-mask', type: ItemType.Roam, category: 'Roam', price: 300, passiveName: 'Encourage', passiveDescription: 'Increases nearby allies Movement Speed by 30% and Physical and Magic Attack by 20% for 3s.' },
  { name: 'Dire Hit', slug: 'dire-hit', type: ItemType.Roam, category: 'Roam', price: 300, passiveName: 'Dire Hit', passiveDescription: 'Dealing damage to an enemy hero triggers extra adaptive damage based on their Max HP.' },
  { name: 'Shadow Mask', slug: 'shadow-mask', type: ItemType.Roam, category: 'Roam', price: 300, passiveName: 'Conceal', passiveDescription: 'Become invisible for 5s with nearby allies. Exiting stealth grants 25% Movement Speed for 2s.' },
];



// ============================================================
// HERO STATS DATA (Top 20 heroes - sample winrate/pickrate/banrate)
// ============================================================
interface HeroStatSeed {
  heroSlug: string;
  winrate: number;
  pickrate: number;
  banrate: number;
}

const heroStats: HeroStatSeed[] = [
  { heroSlug: 'fanny', winrate: 48.2, pickrate: 3.8, banrate: 18.5 },
  { heroSlug: 'ling', winrate: 49.5, pickrate: 5.2, banrate: 22.3 },
  { heroSlug: 'beatrix', winrate: 50.8, pickrate: 8.4, banrate: 25.6 },
  { heroSlug: 'chou', winrate: 50.1, pickrate: 12.5, banrate: 15.2 },
  { heroSlug: 'lancelot', winrate: 50.3, pickrate: 6.1, banrate: 12.8 },
  { heroSlug: 'wanwan', winrate: 51.2, pickrate: 7.3, banrate: 19.4 },
  { heroSlug: 'yu-zhong', winrate: 52.4, pickrate: 6.8, banrate: 16.7 },
  { heroSlug: 'khufra', winrate: 51.8, pickrate: 5.5, banrate: 8.3 },
  { heroSlug: 'valentina', winrate: 51.0, pickrate: 4.9, banrate: 20.1 },
  { heroSlug: 'kagura', winrate: 50.5, pickrate: 4.2, banrate: 6.7 },
  { heroSlug: 'gusion', winrate: 49.1, pickrate: 5.8, banrate: 10.4 },
  { heroSlug: 'paquito', winrate: 51.5, pickrate: 4.5, banrate: 14.3 },
  { heroSlug: 'atlas', winrate: 51.3, pickrate: 4.1, banrate: 7.8 },
  { heroSlug: 'hayabusa', winrate: 50.7, pickrate: 4.8, banrate: 9.2 },
  { heroSlug: 'brody', winrate: 51.6, pickrate: 6.3, banrate: 11.5 },
  { heroSlug: 'karrie', winrate: 52.1, pickrate: 5.7, banrate: 8.9 },
  { heroSlug: 'arlott', winrate: 52.8, pickrate: 5.1, banrate: 17.6 },
  { heroSlug: 'joy', winrate: 49.8, pickrate: 3.9, banrate: 13.2 },
  { heroSlug: 'benedetta', winrate: 49.4, pickrate: 3.6, banrate: 5.1 },
  { heroSlug: 'esmeralda', winrate: 52.3, pickrate: 4.7, banrate: 12.1 },
];



// ============================================================
// COUNTER DATA (30+ matchups with effectiveness and explanation)
// ============================================================
interface CounterSeed {
  heroSlug: string;
  counterSlug: string;
  effectiveness: number;
  explanation: string;
  tips: string;
}

const counters: CounterSeed[] = [
  // Fanny counters
  { heroSlug: 'fanny', counterSlug: 'chou', effectiveness: 85, explanation: 'Chou can interrupt Fanny cables with his kicks and CC chain, making it extremely hard for her to engage.', tips: 'Time your second skill to knock Fanny out of her cable path.' },
  { heroSlug: 'fanny', counterSlug: 'khufra', effectiveness: 90, explanation: 'Khufra ball bounce completely shuts down Fanny cables, bouncing her up and interrupting flight.', tips: 'Use Bouncing Ball in Fanny flight path to interrupt her cables.' },
  { heroSlug: 'fanny', counterSlug: 'franco', effectiveness: 75, explanation: 'Franco hook can catch Fanny mid-flight and suppress locks her down completely.', tips: 'Predict cable trajectory and hook her midway. Save ultimate to suppress.' },
  { heroSlug: 'fanny', counterSlug: 'saber', effectiveness: 72, explanation: 'Saber ultimate locks Fanny in place regardless of her cable state, giving team time to burst.', tips: 'Wait for Fanny to commit to a cable entry, then use Triple Sweep to lock her.' },

  // Ling counters
  { heroSlug: 'ling', counterSlug: 'chou', effectiveness: 80, explanation: 'Chou can kick Ling off walls and chain CC to prevent escape. Strong all-game presence.', tips: 'Wait for Ling to jump from wall, use Jeet Kune Do to knock him up before he repositions.' },
  { heroSlug: 'ling', counterSlug: 'khufra', effectiveness: 85, explanation: 'Khufra ball bounce hits Ling off walls and prevents him from using his mobility freely.', tips: 'Position Bouncing Ball near walls Ling uses. He cannot hop over you safely.' },
  { heroSlug: 'ling', counterSlug: 'saber', effectiveness: 70, explanation: 'Saber ult pierces Ling immunity timing if done correctly, guaranteed lockdown.', tips: 'Time Triple Sweep right after Ling lands. He is vulnerable during brief window.' },
  { heroSlug: 'ling', counterSlug: 'helcurt', effectiveness: 68, explanation: 'Helcurt silence prevents Ling from jumping to walls, stranding him in team fights.', tips: 'Save passive silence for when Ling engages. Ult darkness makes him unable to see wall positions.' },


  // Beatrix counters
  { heroSlug: 'beatrix', counterSlug: 'saber', effectiveness: 75, explanation: 'Saber can gap-close and lock down Beatrix with ultimate, preventing her from using weapon switches.', tips: 'Use full combo: ult > skills to burst Beatrix before she can switch to sniper for range.' },
  { heroSlug: 'beatrix', counterSlug: 'karina', effectiveness: 70, explanation: 'Karina can dash through Beatrix and burst her down with magic damage, bypassing physical defense.', tips: 'Approach from brush, use ult execute when Beatrix is below 50% from poke.' },
  { heroSlug: 'beatrix', counterSlug: 'ling', effectiveness: 65, explanation: 'Ling mobility lets him reach Beatrix backline and burst her before she reacts.', tips: 'Use wall hops to approach from unexpected angles. Tempest of Blades for immunity if needed.' },
  { heroSlug: 'beatrix', counterSlug: 'natalia', effectiveness: 72, explanation: 'Natalia stealth allows her to get right next to Beatrix and silence her, preventing weapon swaps.', tips: 'Approach in stealth, silence attack first to prevent escape skills.' },

  // Gusion counters
  { heroSlug: 'gusion', counterSlug: 'khufra', effectiveness: 78, explanation: 'Khufra ball bounce interrupts Gusion dash skills, preventing his full combo execution.', tips: 'Anticipate Gusion dash and time Bouncing Ball to catch him mid-skill.' },
  { heroSlug: 'gusion', counterSlug: 'chou', effectiveness: 75, explanation: 'Chou CC chain and tankiness allow him to survive and lock Gusion in place.', tips: 'Immune Gusion daggers with second skill timing, then counter with kick combo.' },
  { heroSlug: 'gusion', counterSlug: 'lolita', effectiveness: 80, explanation: 'Lolita shield blocks all Gusion daggers completely, nullifying his burst combo.', tips: 'Raise Guardian Barrier when you see daggers thrown. Block entire second phase.' },

  // Yu Zhong counters
  { heroSlug: 'yu-zhong', counterSlug: 'baxia', effectiveness: 72, explanation: 'Baxia passive reduces Yu Zhong healing significantly, cutting his sustain in fights.', tips: 'Stay in fights to apply anti-heal passive. Build Dominance Ice to further cut regen.' },
  { heroSlug: 'yu-zhong', counterSlug: 'karrie', effectiveness: 70, explanation: 'Karrie percentage HP damage melts Yu Zhong despite his high HP pool and defense.', tips: 'Kite Yu Zhong and use Lightwheel Mark to shred his HP bar quickly.' },
  { heroSlug: 'yu-zhong', counterSlug: 'lunox', effectiveness: 68, explanation: 'Lunox dark ult deals percentage damage and ignores defense scaling.', tips: 'Use Chaos Assault when Yu Zhong commits to ult form. His large hitbox makes it easy to land.' },


  // Lancelot counters
  { heroSlug: 'lancelot', counterSlug: 'chou', effectiveness: 78, explanation: 'Chou can CC Lancelot between dashes and his tankiness survives Lance burst.', tips: 'Wait for Lancelot second skill immunity to end, then kick combo.' },
  { heroSlug: 'lancelot', counterSlug: 'khufra', effectiveness: 82, explanation: 'Khufra bouncing ball catches Lancelot during his dash skills, interrupting combo flow.', tips: 'Position Bouncing Ball in Lancelot engage path.' },
  { heroSlug: 'lancelot', counterSlug: 'phoveus', effectiveness: 76, explanation: 'Phoveus ultimate triggers on every Lancelot dash, punishing his mobility-heavy playstyle.', tips: 'Let Lancelot dash in, then chain ult jumps to him repeatedly.' },

  // Valentina counters
  { heroSlug: 'valentina', counterSlug: 'saber', effectiveness: 72, explanation: 'Saber point-and-click ult makes Valentina unable to dodge, negating her mobility.', tips: 'Gap close with ult when Valentina uses her stolen skill and is vulnerable.' },
  { heroSlug: 'valentina', counterSlug: 'helcurt', effectiveness: 70, explanation: 'Helcurt silence prevents Valentina from using stolen ultimates effectively.', tips: 'Engage with silence passive to prevent ult usage in key moments.' },

  // Wanwan counters
  { heroSlug: 'wanwan', counterSlug: 'franco', effectiveness: 74, explanation: 'Franco hook and suppress lock Wanwan completely, preventing her ult activation.', tips: 'Hook Wanwan and immediately ult. She cannot jump or activate Crossbow of Tang.' },
  { heroSlug: 'wanwan', counterSlug: 'saber', effectiveness: 73, explanation: 'Saber ult lockdown prevents Wanwan from triggering her ultimate and hopping.', tips: 'Save Triple Sweep for when Wanwan tries to activate weakness marks.' },
  { heroSlug: 'wanwan', counterSlug: 'khufra', effectiveness: 70, explanation: 'Khufra kit interrupts Wanwan hops and prevents her from freely repositioning.', tips: 'Use Bouncing Ball when Wanwan attempts to hop around. She cannot dash through you.' },

  // Kagura counters
  { heroSlug: 'kagura', counterSlug: 'lancelot', effectiveness: 72, explanation: 'Lancelot can dodge Kagura umbrella with immunity frames and burst her in close range.', tips: 'Time second skill to dodge umbrella return damage, then burst with ult.' },
  { heroSlug: 'kagura', counterSlug: 'ling', effectiveness: 70, explanation: 'Ling wall mobility allows him to approach Kagura from unexpected angles before she can setup.', tips: 'Wait for Kagura to use umbrella offensively, then drop from wall to engage.' },

  // Paquito counters
  { heroSlug: 'paquito', counterSlug: 'phoveus', effectiveness: 78, explanation: 'Phoveus ult triggers on every Paquito dash, punishing his aggressive combo style heavily.', tips: 'Stand near Paquito and let him dash. Each dash triggers your ultimate gap close.' },
  { heroSlug: 'paquito', counterSlug: 'esmeralda', effectiveness: 70, explanation: 'Esmeralda shield absorption and sustain let her outtrade Paquito in extended fights.', tips: 'Absorb Paquito shield from passive and sustain through his burst with your own shields.' },
];



// ============================================================
// TIER LIST DATA
// ============================================================
interface TierListSeed {
  heroSlug: string;
  tier: Tier;
  roleContext: string;
  reasoning: string;
}

const tierListData: TierListSeed[] = [
  // S+ Tier
  { heroSlug: 'beatrix', tier: Tier.S_PLUS, roleContext: 'Gold Lane', reasoning: 'Extremely versatile with 4 weapons. Dominates lane and team fights with high burst and range.' },
  { heroSlug: 'fanny', tier: Tier.S_PLUS, roleContext: 'Jungle', reasoning: 'Highest mobility in the game when mastered. Can snowball games single-handedly.' },
  { heroSlug: 'ling', tier: Tier.S_PLUS, roleContext: 'Jungle', reasoning: 'Top-tier jungler with incredible mobility, burst damage and team fight ult immunity.' },
  { heroSlug: 'wanwan', tier: Tier.S_PLUS, roleContext: 'Gold Lane', reasoning: 'Amazing late game potential with untargetable ultimate that can wipe entire teams.' },
  { heroSlug: 'valentina', tier: Tier.S_PLUS, roleContext: 'Mid Lane', reasoning: 'Can steal enemy ultimates making her incredibly versatile. High burst and mobility.' },
  { heroSlug: 'arlott', tier: Tier.S_PLUS, roleContext: 'Exp Lane', reasoning: 'Strong sustained damage with excellent crowd control. Dominates lane phase.' },

  // S Tier
  { heroSlug: 'chou', tier: Tier.S, roleContext: 'Exp/Roam', reasoning: 'Extremely versatile fighter. CC chain, immunity frames, and can be played in multiple roles.' },
  { heroSlug: 'yu-zhong', tier: Tier.S, roleContext: 'Exp Lane', reasoning: 'Incredible sustain and team fight presence with dragon form. Hard to kill.' },
  { heroSlug: 'paquito', tier: Tier.S, roleContext: 'Exp Lane', reasoning: 'High burst combo fighter with excellent mobility. Dominates early-mid game.' },
  { heroSlug: 'lancelot', tier: Tier.S, roleContext: 'Jungle', reasoning: 'Amazing burst assassin with immunity frames. Fast jungle clear and high skill ceiling.' },
  { heroSlug: 'gusion', tier: Tier.S, roleContext: 'Jungle', reasoning: 'Devastating burst combos when mastered. One of the highest skill ceiling assassins.' },
  { heroSlug: 'kagura', tier: Tier.S, roleContext: 'Mid Lane', reasoning: 'Complete mage kit with burst, CC, mobility and safety. Very rewarding to master.' },
  { heroSlug: 'khufra', tier: Tier.S, roleContext: 'Roam', reasoning: 'Hard counter to dash heroes. Excellent initiation and disruption in team fights.' },
  { heroSlug: 'atlas', tier: Tier.S, roleContext: 'Roam', reasoning: 'Game-changing ultimate that can grab entire teams. Top tier initiator.' },
  { heroSlug: 'hayabusa', tier: Tier.S, roleContext: 'Jungle', reasoning: 'Excellent split-pusher and duelist. Shadow kill ultimate is devastating in isolated fights.' },
  { heroSlug: 'joy', tier: Tier.S, roleContext: 'Jungle', reasoning: 'Mobile assassin with crowd control immunity during combos. Strong burst potential.' },
  { heroSlug: 'karrie', tier: Tier.S, roleContext: 'Gold Lane', reasoning: 'True damage percentage shred makes her the best tank killer in the game.' },
  { heroSlug: 'brody', tier: Tier.S, roleContext: 'Gold Lane', reasoning: 'Strong early game poke and burst. Long range ultimate finisher.' },
  { heroSlug: 'esmeralda', tier: Tier.S, roleContext: 'Exp Lane', reasoning: 'Shield absorption mechanic gives incredible sustain. Strong in extended fights.' },


  // A Tier
  { heroSlug: 'benedetta', tier: Tier.A, roleContext: 'Exp Lane', reasoning: 'High mobility assassin-fighter hybrid. Dash immunity and burst make her strong in skilled hands.' },
  { heroSlug: 'lunox', tier: Tier.A, roleContext: 'Mid Lane', reasoning: 'Dual form gives both sustain and burst. Percentage damage scales well into late game.' },
  { heroSlug: 'pharsa', tier: Tier.A, roleContext: 'Mid Lane', reasoning: 'Excellent long-range poke with ultimate. Good zone control in team fights.' },
  { heroSlug: 'lylia', tier: Tier.A, roleContext: 'Mid Lane', reasoning: 'Strong burst mage with time reset ultimate that makes her hard to kill.' },
  { heroSlug: 'claude', tier: Tier.A, roleContext: 'Gold Lane', reasoning: 'AoE damage ultimate and mobility make him excellent in team fights once farmed.' },
  { heroSlug: 'thamuz', tier: Tier.A, roleContext: 'Exp Lane', reasoning: 'Excellent sustain fighter with anti-heal capabilities. Strong in extended trades.' },
  { heroSlug: 'franco', tier: Tier.A, roleContext: 'Roam', reasoning: 'Game-changing hooks and suppress ultimate. High impact support tank.' },
  { heroSlug: 'tigreal', tier: Tier.A, roleContext: 'Roam', reasoning: 'Reliable initiator with multi-man knockup. Simple but effective tank.' },
  { heroSlug: 'cecilion', tier: Tier.A, roleContext: 'Mid Lane', reasoning: 'Infinite scaling mana and damage. Becomes a monster in late game team fights.' },
  { heroSlug: 'vale', tier: Tier.A, roleContext: 'Mid Lane', reasoning: 'Versatile mage with customizable abilities. High burst damage potential.' },
  { heroSlug: 'aamon', tier: Tier.A, roleContext: 'Jungle', reasoning: 'Stealth assassin with safe disengage. Good pick-off potential.' },
  { heroSlug: 'karina', tier: Tier.A, roleContext: 'Jungle', reasoning: 'Reset assassin that excels in team fights. Easy to snowball.' },
  { heroSlug: 'mathilda', tier: Tier.A, roleContext: 'Roam', reasoning: 'Versatile support with engage, disengage, and team mobility.' },
  { heroSlug: 'estes', tier: Tier.A, roleContext: 'Roam', reasoning: 'Best pure healer. Sustain composition enabler.' },
  { heroSlug: 'angela', tier: Tier.A, roleContext: 'Roam', reasoning: 'Global presence with ultimate. Can turn any fight with attach mechanic.' },
  { heroSlug: 'moskov', tier: Tier.A, roleContext: 'Gold Lane', reasoning: 'High attack speed marksman with stun and penetrating basic attacks.' },
  { heroSlug: 'phoveus', tier: Tier.A, roleContext: 'Exp Lane', reasoning: 'Hard counter to dash heroes with chain ultimates. Strong niche pick.' },
  { heroSlug: 'saber', tier: Tier.A, roleContext: 'Jungle', reasoning: 'Point-and-click ultimate guarantees picks. Reliable single-target assassin.' },
  { heroSlug: 'selena', tier: Tier.A, roleContext: 'Mid/Roam', reasoning: 'Long-range stun and burst combo. Excellent vision control with traps.' },


  // B Tier
  { heroSlug: 'x-borg', tier: Tier.B, roleContext: 'Exp Lane', reasoning: 'Sustained damage and armor mechanic give survivability. Anti-heal built in.' },
  { heroSlug: 'aldous', tier: Tier.B, roleContext: 'Exp Lane', reasoning: 'Stacking damage makes him strong late game. Global map vision ultimate.' },
  { heroSlug: 'guinevere', tier: Tier.B, roleContext: 'Exp Lane', reasoning: 'Good burst combo with knockup. Struggles against CC-heavy compositions.' },
  { heroSlug: 'silvanna', tier: Tier.B, roleContext: 'Exp Lane', reasoning: 'Lock-down ultimate and sustained damage. Good niche fighter pick.' },
  { heroSlug: 'freya', tier: Tier.B, roleContext: 'Exp Lane', reasoning: 'Strong 1v1 duelist with shield and CC. Decent split-push potential.' },
  { heroSlug: 'badang', tier: Tier.B, roleContext: 'Exp Lane', reasoning: 'Wall combo can devastate in tight spaces. Niche but powerful AoE burst.' },
  { heroSlug: 'dyrroth', tier: Tier.B, roleContext: 'Exp Lane', reasoning: 'Armor shred and burst make him good against tanks. Simple but effective.' },
  { heroSlug: 'alpha', tier: Tier.B, roleContext: 'Exp Lane', reasoning: 'Reliable fighter with sustain and CC. Good for beginners.' },
  { heroSlug: 'helcurt', tier: Tier.B, roleContext: 'Jungle', reasoning: 'Silence and darkness ultimate disrupt team coordination. Strong ambush potential.' },
  { heroSlug: 'yin', tier: Tier.B, roleContext: 'Jungle', reasoning: 'Domain ultimate isolates targets. Good for picking off carries.' },
  { heroSlug: 'johnson', tier: Tier.B, roleContext: 'Roam', reasoning: 'Unique car ultimate for rotations. Good engage but predictable.' },
  { heroSlug: 'hylos', tier: Tier.B, roleContext: 'Roam', reasoning: 'Tanky frontline with path zone control. Good against physical teams.' },
  { heroSlug: 'akai', tier: Tier.B, roleContext: 'Roam', reasoning: 'Pin ultimate can isolate key targets. Anti-shield passive.' },
  { heroSlug: 'grock', tier: Tier.B, roleContext: 'Roam', reasoning: 'Strong early game roamer. Wall creates terrain advantages.' },
  { heroSlug: 'yve', tier: Tier.B, roleContext: 'Mid Lane', reasoning: 'Zone control mage with huge ultimate area. Good in team fights.' },
  { heroSlug: 'xavier', tier: Tier.B, roleContext: 'Mid Lane', reasoning: 'Global ultimate snipe. Safe long-range poke damage.' },
  { heroSlug: 'novaria', tier: Tier.B, roleContext: 'Mid Lane', reasoning: 'Long range poke and vision control with sphere. Safe damage dealer.' },
  { heroSlug: 'zhuxin', tier: Tier.B, roleContext: 'Mid Lane', reasoning: 'Good burst mage with chase potential. Mobility and damage combined.' },
  { heroSlug: 'lesley', tier: Tier.B, roleContext: 'Gold Lane', reasoning: 'Long range sniper with stealth. Late game burst damage.' },
  { heroSlug: 'irithel', tier: Tier.B, roleContext: 'Gold Lane', reasoning: 'Can attack while moving. Strong late game team fight DPS.' },
  { heroSlug: 'bruno', tier: Tier.B, roleContext: 'Gold Lane', reasoning: 'High crit damage marksman. Good with Endless Battle procs.' },
  { heroSlug: 'edith', tier: Tier.B, roleContext: 'Exp Lane', reasoning: 'Tank-marksman hybrid. Versatile with both melee and ranged forms.' },
  { heroSlug: 'rafaela', tier: Tier.B, roleContext: 'Roam', reasoning: 'Consistent healing and speed buff. Good team-wide sustain.' },
  { heroSlug: 'floryn', tier: Tier.B, roleContext: 'Roam', reasoning: 'Global heal and free item for carry. Simple healing support.' },
  { heroSlug: 'diggie', tier: Tier.B, roleContext: 'Roam', reasoning: 'Anti-CC ultimate cleanses entire team. Unique CC-immune death passive.' },
  { heroSlug: 'natalia', tier: Tier.B, roleContext: 'Roam', reasoning: 'Stealth assassin-roamer. Excellent for pick-offs and map pressure.' },


  // C Tier
  { heroSlug: 'miya', tier: Tier.C, roleContext: 'Gold Lane', reasoning: 'Solid beginner marksman but outclassed by meta picks. Good late game DPS.' },
  { heroSlug: 'layla', tier: Tier.C, roleContext: 'Gold Lane', reasoning: 'Longest range in game but immobile. Very vulnerable to assassins.' },
  { heroSlug: 'hanabi', tier: Tier.C, roleContext: 'Gold Lane', reasoning: 'CC immunity shield and bounce attacks. Weak early game limits viability.' },
  { heroSlug: 'zilong', tier: Tier.C, roleContext: 'Exp Lane', reasoning: 'Simple fighter with flip. Fast split-push but lacks team fight impact.' },
  { heroSlug: 'balmond', tier: Tier.C, roleContext: 'Exp Lane', reasoning: 'Easy to play fighter. Good sustain but predictable and easily kited.' },
  { heroSlug: 'sun', tier: Tier.C, roleContext: 'Exp Lane', reasoning: 'Clone-based fighter good at split pushing. Weak in higher ranks.' },
  { heroSlug: 'eudora', tier: Tier.C, roleContext: 'Mid Lane', reasoning: 'One-shot burst combo mage. Simple and effective but very squishy and immobile.' },
  { heroSlug: 'aurora', tier: Tier.C, roleContext: 'Mid Lane', reasoning: 'Freeze CC burst mage. Predictable but punishing when combo lands.' },
  { heroSlug: 'nana', tier: Tier.C, roleContext: 'Mid Lane', reasoning: 'Anti-dive with Molina transform. Passive resurrection but low damage.' },
  { heroSlug: 'aulus', tier: Tier.C, roleContext: 'Exp Lane', reasoning: 'Stacking attack speed fighter. Strong late but needs time to scale.' },
  { heroSlug: 'hanzo', tier: Tier.C, roleContext: 'Jungle', reasoning: 'Unique astral projection but vulnerable real body is a major weakness.' },
  { heroSlug: 'faramis', tier: Tier.C, roleContext: 'Roam', reasoning: 'Resurrection zone ultimate. Niche pick that depends heavily on team coordination.' },
  { heroSlug: 'minotaur', tier: Tier.C, roleContext: 'Roam', reasoning: 'Rage mechanic limits initiation timing. Good heal and CC when raged.' },
  { heroSlug: 'argus', tier: Tier.C, roleContext: 'Exp Lane', reasoning: 'Immortality ultimate but easily kited outside of it. Feast or famine.' },
];



// ============================================================
// HERO COMBOS DATA
// ============================================================
interface ComboSeed {
  name: string;
  description: string;
  strategy: string;
  difficulty: number;
  synergyScore: number;
  heroes: { heroSlug: string; roleInCombo: string }[];
}

const combos: ComboSeed[] = [
  {
    name: 'Atlas + Beatrix Wombo Combo',
    description: 'Atlas initiates with Fatal Links to group enemies, Beatrix follows up with Wesker burst or Nibiru AoE for massive team wipe.',
    strategy: 'Atlas flanks and lands multi-man ult. Beatrix uses SMG close range or Sniper for follow-up damage. Works best when enemy team is grouped for objective.',
    difficulty: 6,
    synergyScore: 90,
    heroes: [
      { heroSlug: 'atlas', roleInCombo: 'Initiator' },
      { heroSlug: 'beatrix', roleInCombo: 'Damage Dealer' },
    ],
  },
  {
    name: 'Johnson + Odette Crash Combo',
    description: 'Johnson drives into enemy team with Odette inside using Angela attach. Odette ults on impact for massive AoE damage.',
    strategy: 'Johnson activates ult with ally inside. Drive into grouped enemies. Passenger uses AoE skills immediately on crash. Best used from fog of war.',
    difficulty: 5,
    synergyScore: 85,
    heroes: [
      { heroSlug: 'johnson', roleInCombo: 'Driver/Initiator' },
      { heroSlug: 'cecilion', roleInCombo: 'AoE Damage' },
    ],
  },
  {
    name: 'Tigreal + Vale Burst Combo',
    description: 'Tigreal flicker-ults to group enemies, Vale follows with enhanced knock-up and damage ultimate for devastating burst.',
    strategy: 'Tigreal uses Flicker during ult channel to surprise enemies. Vale drops knock-up on grouped targets then ults. Timing is critical for maximum overlap.',
    difficulty: 7,
    synergyScore: 88,
    heroes: [
      { heroSlug: 'tigreal', roleInCombo: 'Initiator/Grouper' },
      { heroSlug: 'vale', roleInCombo: 'Burst Damage' },
    ],
  },
  {
    name: 'Angela + Yu Zhong Dive Comp',
    description: 'Angela attaches to Yu Zhong as he dives. Her shield, heal and CC help Yu Zhong sustain through the entire enemy team.',
    strategy: 'Yu Zhong engages in dragon form. Angela attaches during or before transformation. The combined sustain makes Yu Zhong nearly unkillable while dealing massive AoE damage.',
    difficulty: 4,
    synergyScore: 92,
    heroes: [
      { heroSlug: 'angela', roleInCombo: 'Sustain/Attach Support' },
      { heroSlug: 'yu-zhong', roleInCombo: 'Frontline Carry' },
    ],
  },
];



// ============================================================
// SEED FUNCTIONS
// ============================================================

async function seedHeroes() {
  console.log('🦸 Seeding heroes...');
  let count = 0;
  for (const hero of heroes) {
    await prisma.hero.upsert({
      where: { slug: hero.slug },
      update: {
        name: hero.name,
        role: hero.role,
        lane: hero.lane,
        difficulty: hero.difficulty,
        specialty: hero.specialty,
        isActive: true,
      },
      create: {
        name: hero.name,
        slug: hero.slug,
        role: hero.role,
        lane: hero.lane,
        difficulty: hero.difficulty,
        specialty: hero.specialty,
        isActive: true,
      },
    });
    count++;
  }
  console.log(`   ✅ Seeded ${count} heroes`);
}

async function seedBattleSpells() {
  console.log('✨ Seeding battle spells...');
  let count = 0;
  for (const spell of battleSpells) {
    await prisma.battleSpell.upsert({
      where: { slug: spell.slug },
      update: {
        name: spell.name,
        description: spell.description,
        cooldown: spell.cooldown,
        unlockLevel: spell.unlockLevel,
        isActive: true,
      },
      create: {
        name: spell.name,
        slug: spell.slug,
        description: spell.description,
        cooldown: spell.cooldown,
        unlockLevel: spell.unlockLevel,
        isActive: true,
      },
    });
    count++;
  }
  console.log(`   ✅ Seeded ${count} battle spells`);
}



async function seedItems() {
  console.log('🗡️  Seeding items...');
  let count = 0;
  for (const item of items) {
    await prisma.item.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        type: item.type,
        category: item.category,
        price: item.price,
        passiveName: item.passiveName || null,
        passiveDescription: item.passiveDescription || null,
        isActive: true,
      },
      create: {
        name: item.name,
        slug: item.slug,
        type: item.type,
        category: item.category,
        price: item.price,
        passiveName: item.passiveName || null,
        passiveDescription: item.passiveDescription || null,
        isActive: true,
      },
    });
    count++;
  }
  console.log(`   ✅ Seeded ${count} items`);
}

async function seedHeroStats() {
  console.log('📊 Seeding hero stats...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let count = 0;

  for (const stat of heroStats) {
    const hero = await prisma.hero.findUnique({ where: { slug: stat.heroSlug } });
    if (!hero) {
      console.warn(`   ⚠️  Hero not found: ${stat.heroSlug}`);
      continue;
    }

    // Use upsert logic: check if stat exists for this hero+date+rank
    const existing = await prisma.heroStats.findFirst({
      where: {
        heroId: hero.id,
        rankTier: RankTier.Mythic,
        recordedAt: today,
      },
    });

    if (existing) {
      await prisma.heroStats.update({
        where: { id: existing.id },
        data: {
          winrate: stat.winrate,
          pickrate: stat.pickrate,
          banrate: stat.banrate,
          patchVersion: '1.8.44',
        },
      });
    } else {
      await prisma.heroStats.create({
        data: {
          heroId: hero.id,
          winrate: stat.winrate,
          pickrate: stat.pickrate,
          banrate: stat.banrate,
          rankTier: RankTier.Mythic,
          patchVersion: '1.8.44',
          recordedAt: today,
        },
      });
    }
    count++;
  }
  console.log(`   ✅ Seeded ${count} hero stat entries`);
}



async function seedCounters() {
  console.log('⚔️  Seeding counter data...');
  let count = 0;

  for (const counter of counters) {
    const hero = await prisma.hero.findUnique({ where: { slug: counter.heroSlug } });
    const counterHero = await prisma.hero.findUnique({ where: { slug: counter.counterSlug } });

    if (!hero || !counterHero) {
      console.warn(`   ⚠️  Matchup not found: ${counter.heroSlug} vs ${counter.counterSlug}`);
      continue;
    }

    await prisma.heroCounter.upsert({
      where: {
        heroId_counterId: {
          heroId: hero.id,
          counterId: counterHero.id,
        },
      },
      update: {
        effectiveness: counter.effectiveness,
        explanation: counter.explanation,
        tips: counter.tips,
        source: 'seed',
      },
      create: {
        heroId: hero.id,
        counterId: counterHero.id,
        effectiveness: counter.effectiveness,
        explanation: counter.explanation,
        tips: counter.tips,
        source: 'seed',
      },
    });
    count++;
  }
  console.log(`   ✅ Seeded ${count} counter matchups`);
}

async function seedTierList() {
  console.log('🏆 Seeding tier list...');
  const patchVersion = '1.8.44';
  let count = 0;

  for (const entry of tierListData) {
    const hero = await prisma.hero.findUnique({ where: { slug: entry.heroSlug } });
    if (!hero) {
      console.warn(`   ⚠️  Hero not found for tier: ${entry.heroSlug}`);
      continue;
    }

    await prisma.tierList.upsert({
      where: {
        heroId_rankTier_patchVersion: {
          heroId: hero.id,
          rankTier: RankTier.All,
          patchVersion: patchVersion,
        },
      },
      update: {
        tier: entry.tier,
        roleContext: entry.roleContext,
        reasoning: entry.reasoning,
      },
      create: {
        heroId: hero.id,
        tier: entry.tier,
        rankTier: RankTier.All,
        roleContext: entry.roleContext,
        patchVersion: patchVersion,
        reasoning: entry.reasoning,
      },
    });
    count++;
  }
  console.log(`   ✅ Seeded ${count} tier list entries`);
}



async function seedCombos() {
  console.log('🤝 Seeding hero combos...');
  let count = 0;

  for (const combo of combos) {
    // Check if combo already exists by name
    const existing = await prisma.heroCombo.findFirst({
      where: { name: combo.name },
    });

    let comboRecord;
    if (existing) {
      comboRecord = await prisma.heroCombo.update({
        where: { id: existing.id },
        data: {
          description: combo.description,
          strategy: combo.strategy,
          difficulty: combo.difficulty,
          synergyScore: combo.synergyScore,
        },
      });
      // Delete existing combo heroes to re-create them
      await prisma.comboHero.deleteMany({ where: { comboId: comboRecord.id } });
    } else {
      comboRecord = await prisma.heroCombo.create({
        data: {
          name: combo.name,
          description: combo.description,
          strategy: combo.strategy,
          difficulty: combo.difficulty,
          synergyScore: combo.synergyScore,
        },
      });
    }

    // Add heroes to combo
    for (const heroEntry of combo.heroes) {
      const hero = await prisma.hero.findUnique({ where: { slug: heroEntry.heroSlug } });
      if (!hero) {
        console.warn(`   ⚠️  Combo hero not found: ${heroEntry.heroSlug}`);
        continue;
      }
      await prisma.comboHero.create({
        data: {
          comboId: comboRecord.id,
          heroId: hero.id,
          roleInCombo: heroEntry.roleInCombo,
        },
      });
    }
    count++;
  }
  console.log(`   ✅ Seeded ${count} hero combos`);
}

async function seedAdminUser() {
  console.log('👤 Seeding admin user...');

  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {
      email: 'admin@mlbb-counter.com',
      passwordHash: passwordHash,
      role: AdminRole.superadmin,
      isActive: true,
    },
    create: {
      username: 'admin',
      email: 'admin@mlbb-counter.com',
      passwordHash: passwordHash,
      role: AdminRole.superadmin,
      isActive: true,
    },
  });

  console.log('   ✅ Admin user created (username: admin, email: admin@mlbb-counter.com)');
}



// ============================================================
// MAIN EXECUTION
// ============================================================
async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     MLBB Counter Hero - Database Seed Script     ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  const startTime = Date.now();

  try {
    await seedHeroes();
    await seedBattleSpells();
    await seedItems();
    await seedHeroStats();
    await seedCounters();
    await seedTierList();
    await seedCombos();
    await seedAdminUser();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log(`🎉 Seed completed successfully in ${duration}s`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('Summary:');
    console.log(`  • Heroes:        ${heroes.length}`);
    console.log(`  • Battle Spells: ${battleSpells.length}`);
    console.log(`  • Items:         ${items.length}`);
    console.log(`  • Hero Stats:    ${heroStats.length}`);
    console.log(`  • Counters:      ${counters.length}`);
    console.log(`  • Tier Entries:  ${tierListData.length}`);
    console.log(`  • Combos:        ${combos.length}`);
    console.log(`  • Admin Users:   1`);
    console.log('');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
