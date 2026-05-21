import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { StealthBrowser } from '../utils/stealth';
import { ScraperRateLimiter } from '../utils/rate-limiter';
import { CircuitBreaker } from '../utils/circuit-breaker';
import { BaseScraper } from './base.scraper';

interface RawSpellData {
  name: string;
  description?: string;
  cooldown?: number;
  unlockLevel?: number;
  imageUrl?: string;
}

@Injectable()
export class SpellScraper extends BaseScraper {
  protected readonly logger = new Logger(SpellScraper.name);
  protected readonly source = 'mlbb-spells';

  constructor(
    prisma: PrismaService,
    browser: StealthBrowser,
    rateLimiter: ScraperRateLimiter,
    circuitBreaker: CircuitBreaker,
  ) {
    super(prisma, browser, rateLimiter, circuitBreaker);
  }

  async scrape(): Promise<number> {
    this.logger.log('Starting spell data scrape...');

    const spellsData = await this.fetchSpells();
    let recordsAffected = 0;

    for (const spellData of spellsData) {
      const slug = this.slugify(spellData.name);

      await this.prisma.battleSpell.upsert({
        where: { slug },
        update: {
          name: spellData.name,
          description: spellData.description || null,
          cooldown: spellData.cooldown || null,
          unlockLevel: spellData.unlockLevel || null,
          imageUrl: spellData.imageUrl || null,
        },
        create: {
          name: spellData.name,
          slug,
          description: spellData.description || null,
          cooldown: spellData.cooldown || null,
          unlockLevel: spellData.unlockLevel || null,
          imageUrl: spellData.imageUrl || null,
        },
      });
      recordsAffected++;
    }

    this.logger.log(`Spell scrape completed: ${recordsAffected} records`);
    return recordsAffected;
  }

  private async fetchSpells(): Promise<RawSpellData[]> {
    try {
      const html = await this.fetchPage(
        'https://m.mobilelegends.com/en/spell',
      );
      return this.parseSpellsHtml(html);
    } catch (error) {
      this.logger.warn(`Spell source failed: ${error.message}`);
      return [];
    }
  }

  private parseSpellsHtml(html: string): RawSpellData[] {
    const spells: RawSpellData[] = [];

    const jsonMatch = html.match(/spellList\s*[:=]\s*(\[[\s\S]*?\]);/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed.map((s: any) => ({
          name: s.name,
          description: s.desc || s.description,
          cooldown: parseInt(s.cd || s.cooldown) || null,
          unlockLevel: parseInt(s.level || s.unlock_level) || null,
          imageUrl: s.icon || s.img,
        }));
      } catch { /* ignore */ }
    }

    const blocks = html.match(
      /<div[^>]*class="[^"]*spell[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi,
    ) || [];

    for (const block of blocks) {
      const nameMatch = block.match(
        /class="[^"]*spell-name[^"]*"[^>]*>([^<]+)/i,
      );
      const descMatch = block.match(
        /class="[^"]*spell-desc[^"]*"[^>]*>([\s\S]*?)<\//i,
      );
      const cdMatch = block.match(/(\d+)\s*s/i);

      if (nameMatch) {
        spells.push({
          name: nameMatch[1].trim(),
          description: descMatch
            ? descMatch[1].replace(/<[^>]+>/g, '').trim()
            : undefined,
          cooldown: cdMatch ? parseInt(cdMatch[1]) : undefined,
        });
      }
    }

    return spells;
  }
}
