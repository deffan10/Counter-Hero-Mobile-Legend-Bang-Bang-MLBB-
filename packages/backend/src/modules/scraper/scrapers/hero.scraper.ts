import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { StealthBrowser } from '../utils/stealth';
import { ScraperRateLimiter } from '../utils/rate-limiter';
import { CircuitBreaker } from '../utils/circuit-breaker';
import { BaseScraper } from './base.scraper';

interface RawHeroData {
  name: string;
  role: string;
  specialty?: string;
  lane?: string;
  difficulty?: number;
  imageUrl?: string;
  iconUrl?: string;
  lore?: string;
}

interface RawCounterData {
  heroName: string;
  counterName: string;
  effectiveness: number;
  explanation?: string;
  tips?: string;
}

@Injectable()
export class HeroScraper extends BaseScraper {
  protected readonly logger = new Logger(HeroScraper.name);
  protected readonly source = 'mlbb-official';

  constructor(
    prisma: PrismaService,
    browser: StealthBrowser,
    rateLimiter: ScraperRateLimiter,
    circuitBreaker: CircuitBreaker,
  ) {
    super(prisma, browser, rateLimiter, circuitBreaker);
  }

  async scrape(): Promise<number> {
    this.logger.log('Starting hero data scrape...');

    const heroesData = await this.fetchHeroList();
    let recordsAffected = 0;

    for (const heroData of heroesData) {
      const slug = this.slugify(heroData.name);
      const role = this.normalizeRole(heroData.role);
      const lane = this.normalizeLane(heroData.lane);

      const existing = await this.prisma.hero.findUnique({ where: { slug } });

      if (existing) {
        // Check if data changed (diff detection)
        const hasChanged =
          existing.name !== heroData.name ||
          existing.role !== role ||
          existing.specialty !== (heroData.specialty || null) ||
          existing.imageUrl !== (heroData.imageUrl || null);

        if (hasChanged) {
          await this.prisma.hero.update({
            where: { slug },
            data: {
              name: heroData.name,
              role,
              specialty: heroData.specialty || null,
              difficulty: heroData.difficulty || 1,
              imageUrl: heroData.imageUrl || null,
              iconUrl: heroData.iconUrl || null,
              lane: lane || null,
              lore: heroData.lore || null,
            },
          });
          recordsAffected++;
        }
      } else {
        await this.prisma.hero.create({
          data: {
            name: heroData.name,
            slug,
            role,
            specialty: heroData.specialty || null,
            difficulty: heroData.difficulty || 1,
            imageUrl: heroData.imageUrl || null,
            iconUrl: heroData.iconUrl || null,
            lane: lane || null,
            lore: heroData.lore || null,
          },
        });
        recordsAffected++;
      }
    }

    this.logger.log(`Hero scrape completed: ${recordsAffected} records affected`);
    return recordsAffected;
  }

  async scrapeCounters(): Promise<number> {
    this.logger.log('Starting counter data scrape...');

    const countersData = await this.fetchCounterData();
    let recordsAffected = 0;

    for (const counterData of countersData) {
      const heroSlug = this.slugify(counterData.heroName);
      const counterSlug = this.slugify(counterData.counterName);

      const hero = await this.prisma.hero.findUnique({ where: { slug: heroSlug } });
      const counter = await this.prisma.hero.findUnique({ where: { slug: counterSlug } });

      if (!hero || !counter) continue;

      await this.prisma.heroCounter.upsert({
        where: {
          heroId_counterId: { heroId: hero.id, counterId: counter.id },
        },
        update: {
          effectiveness: counterData.effectiveness,
          explanation: counterData.explanation || null,
          tips: counterData.tips || null,
          source: this.source,
        },
        create: {
          heroId: hero.id,
          counterId: counter.id,
          effectiveness: counterData.effectiveness,
          explanation: counterData.explanation || null,
          tips: counterData.tips || null,
          source: this.source,
        },
      });
      recordsAffected++;
    }

    this.logger.log(`Counter scrape completed: ${recordsAffected} records affected`);
    return recordsAffected;
  }

  private async fetchHeroList(): Promise<RawHeroData[]> {
    // Primary: try MLBB official API/page
    try {
      const html = await this.fetchPage('https://m.mobilelegends.com/en/hero');
      return this.parseHeroListHtml(html);
    } catch (error) {
      this.logger.warn(`Primary source failed: ${error.message}. Trying fallback...`);
    }

    // Fallback: try community API
    try {
      const data = await this.fetchJson<any>('https://mapi.mobilelegends.com/hero/list');
      if (data?.data) {
        return data.data.map((h: any) => ({
          name: h.name,
          role: h.role || 'Fighter',
          specialty: h.specialty,
          imageUrl: h.head || h.cover,
          iconUrl: h.head,
        }));
      }
    } catch (error) {
      this.logger.warn(`Fallback source failed: ${error.message}`);
    }

    this.logger.error('All hero data sources failed');
    return [];
  }

  private parseHeroListHtml(html: string): RawHeroData[] {
    const heroes: RawHeroData[] = [];

    // Parse hero names and roles from HTML using regex (lightweight, no DOM dependency)
    const heroBlocks = html.match(/<a[^>]*class="[^"]*hero-item[^"]*"[^>]*>[\s\S]*?<\/a>/gi) || [];

    for (const block of heroBlocks) {
      const nameMatch = block.match(/data-name="([^"]+)"/i) || block.match(/<[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)/i);
      const roleMatch = block.match(/data-role="([^"]+)"/i);
      const imgMatch = block.match(/src="([^"]+)"/i);

      if (nameMatch) {
        heroes.push({
          name: nameMatch[1].trim(),
          role: roleMatch ? roleMatch[1] : 'Fighter',
          iconUrl: imgMatch ? imgMatch[1] : undefined,
        });
      }
    }

    // If regex parsing fails, try JSON embedded in page
    if (heroes.length === 0) {
      const jsonMatch = html.match(/heroList\s*[:=]\s*(\[[\s\S]*?\])/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          return parsed.map((h: any) => ({
            name: h.name || h.heroName,
            role: h.role || h.heroRole || 'Fighter',
            iconUrl: h.icon || h.img,
          }));
        } catch { /* ignore parse errors */ }
      }
    }

    return heroes;
  }

  private async fetchCounterData(): Promise<RawCounterData[]> {
    // This would scrape community counter data sources
    // For now, returns empty - to be implemented with real source
    try {
      const html = await this.fetchPage('https://m.mobilelegends.com/en/hero');
      // Parse counter relationships from community data
      return this.parseCounterHtml(html);
    } catch {
      return [];
    }
  }

  private parseCounterHtml(_html: string): RawCounterData[] {
    // Placeholder - would parse actual counter data from source
    return [];
  }

  private normalizeRole(role?: string): any {
    const roleMap: Record<string, string> = {
      tank: 'Tank',
      fighter: 'Fighter',
      assassin: 'Assassin',
      mage: 'Mage',
      marksman: 'Marksman',
      mm: 'Marksman',
      support: 'Support',
    };
    return roleMap[role?.toLowerCase() || ''] || 'Fighter';
  }

  private normalizeLane(lane?: string): any {
    if (!lane) return null;
    const laneMap: Record<string, string> = {
      gold: 'Gold',
      exp: 'Exp',
      mid: 'Mid',
      roam: 'Roam',
      jungle: 'Jungle',
      jg: 'Jungle',
    };
    return laneMap[lane.toLowerCase()] || null;
  }
}
