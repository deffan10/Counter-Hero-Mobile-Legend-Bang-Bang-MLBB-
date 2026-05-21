import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { StealthBrowser } from '../utils/stealth';
import { ScraperRateLimiter } from '../utils/rate-limiter';
import { CircuitBreaker } from '../utils/circuit-breaker';
import { BaseScraper } from './base.scraper';

interface RawStatsData {
  heroName: string;
  winrate: number;
  pickrate: number;
  banrate: number;
  rankTier?: string;
}

@Injectable()
export class StatsScraper extends BaseScraper {
  protected readonly logger = new Logger(StatsScraper.name);
  protected readonly source = 'mlbb-stats';

  constructor(
    prisma: PrismaService,
    browser: StealthBrowser,
    rateLimiter: ScraperRateLimiter,
    circuitBreaker: CircuitBreaker,
  ) {
    super(prisma, browser, rateLimiter, circuitBreaker);
  }

  async scrape(): Promise<number> {
    this.logger.log('Starting stats scrape...');

    const statsData = await this.fetchStats();
    let recordsAffected = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const stat of statsData) {
      const heroSlug = this.slugify(stat.heroName);
      const hero = await this.prisma.hero.findUnique({ where: { slug: heroSlug } });

      if (!hero) {
        this.logger.warn(`Hero not found for stats: ${stat.heroName} (${heroSlug})`);
        continue;
      }

      const rankTier = this.normalizeRankTier(stat.rankTier);

      // Check if we already have stats for today
      const existing = await this.prisma.heroStats.findFirst({
        where: {
          heroId: hero.id,
          rankTier: rankTier as any,
          recordedAt: today,
        },
      });

      if (existing) {
        // Update if values changed
        if (
          Number(existing.winrate) !== stat.winrate ||
          Number(existing.pickrate) !== stat.pickrate ||
          Number(existing.banrate) !== stat.banrate
        ) {
          await this.prisma.heroStats.update({
            where: { id: existing.id },
            data: {
              winrate: stat.winrate,
              pickrate: stat.pickrate,
              banrate: stat.banrate,
            },
          });
          recordsAffected++;
        }
      } else {
        await this.prisma.heroStats.create({
          data: {
            heroId: hero.id,
            winrate: stat.winrate,
            pickrate: stat.pickrate,
            banrate: stat.banrate,
            rankTier: rankTier as any,
            recordedAt: today,
          },
        });
        recordsAffected++;
      }
    }

    this.logger.log(`Stats scrape completed: ${recordsAffected} records affected`);
    return recordsAffected;
  }

  async scrapeTierList(): Promise<number> {
    this.logger.log('Starting tier list calculation...');

    // Calculate tier list from latest stats
    const heroes = await this.prisma.hero.findMany({
      where: { isActive: true },
      include: {
        stats: {
          where: { rankTier: 'All' },
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });

    const heroesWithStats = heroes
      .filter((h) => h.stats.length > 0 && h.stats[0].winrate !== null)
      .map((h) => ({
        id: h.id,
        winrate: Number(h.stats[0].winrate),
        pickrate: Number(h.stats[0].pickrate),
        banrate: Number(h.stats[0].banrate),
      }));

    if (heroesWithStats.length === 0) return 0;

    // Score = winrate * 0.4 + pickrate * 0.3 + banrate * 0.3
    const scored = heroesWithStats.map((h) => ({
      ...h,
      score: h.winrate * 0.4 + h.pickrate * 0.3 + h.banrate * 0.3,
    }));

    scored.sort((a, b) => b.score - a.score);

    // Assign tiers based on percentile
    const total = scored.length;
    let recordsAffected = 0;

    for (let i = 0; i < total; i++) {
      const percentile = i / total;
      let tier: string;

      if (percentile < 0.05) tier = 'S_PLUS';
      else if (percentile < 0.15) tier = 'S';
      else if (percentile < 0.35) tier = 'A';
      else if (percentile < 0.60) tier = 'B';
      else if (percentile < 0.80) tier = 'C';
      else tier = 'D';

      const heroId = scored[i].id;

      await this.prisma.tierList.upsert({
        where: {
          heroId_rankTier_patchVersion: {
            heroId,
            rankTier: 'All',
            patchVersion: 'current',
          },
        },
        update: {
          tier: tier as any,
          reasoning: `Score: ${scored[i].score.toFixed(1)} (WR: ${scored[i].winrate}%, PR: ${scored[i].pickrate}%, BR: ${scored[i].banrate}%)`,
        },
        create: {
          heroId,
          tier: tier as any,
          rankTier: 'All',
          patchVersion: 'current',
          reasoning: `Score: ${scored[i].score.toFixed(1)} (WR: ${scored[i].winrate}%, PR: ${scored[i].pickrate}%, BR: ${scored[i].banrate}%)`,
        },
      });
      recordsAffected++;
    }

    this.logger.log(`Tier list calculated: ${recordsAffected} entries`);
    return recordsAffected;
  }

  private async fetchStats(): Promise<RawStatsData[]> {
    try {
      // Try community stats API
      const html = await this.fetchPage('https://m.mobilelegends.com/en/rank');
      return this.parseStatsHtml(html);
    } catch (error) {
      this.logger.warn(`Stats source failed: ${error.message}`);
      return [];
    }
  }

  private parseStatsHtml(html: string): RawStatsData[] {
    const stats: RawStatsData[] = [];

    // Try to extract JSON data from page
    const jsonMatch = html.match(/heroRankData\s*[:=]\s*(\[[\s\S]*?\])/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed.map((h: any) => ({
          heroName: h.name || h.heroName,
          winrate: parseFloat(h.winRate || h.winrate || '50'),
          pickrate: parseFloat(h.pickRate || h.pickrate || '5'),
          banrate: parseFloat(h.banRate || h.banrate || '0'),
          rankTier: h.rank || 'All',
        }));
      } catch { /* ignore parse error */ }
    }

    // Fallback: parse table rows
    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    for (const row of rows) {
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      if (cells.length >= 4) {
        const nameMatch = cells[0].match(/>([^<]+)</);
        const wrMatch = cells[1].match(/([\d.]+)/);
        const prMatch = cells[2].match(/([\d.]+)/);
        const brMatch = cells[3].match(/([\d.]+)/);

        if (nameMatch && wrMatch) {
          stats.push({
            heroName: nameMatch[1].trim(),
            winrate: parseFloat(wrMatch[1]),
            pickrate: prMatch ? parseFloat(prMatch[1]) : 0,
            banrate: brMatch ? parseFloat(brMatch[1]) : 0,
          });
        }
      }
    }

    return stats;
  }

  private normalizeRankTier(rank?: string): string {
    if (!rank) return 'All';
    const map: Record<string, string> = {
      all: 'All',
      mythic: 'Mythic',
      legend: 'Legend',
      epic: 'Epic',
      grandmaster: 'Grandmaster',
    };
    return map[rank.toLowerCase()] || 'All';
  }
}
