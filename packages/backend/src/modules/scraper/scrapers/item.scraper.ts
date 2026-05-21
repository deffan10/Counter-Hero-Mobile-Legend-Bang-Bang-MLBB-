import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { StealthBrowser } from '../utils/stealth';
import { ScraperRateLimiter } from '../utils/rate-limiter';
import { CircuitBreaker } from '../utils/circuit-breaker';
import { BaseScraper } from './base.scraper';

interface RawItemData {
  name: string;
  type: string;
  category?: string;
  price?: number;
  stats?: Record<string, number>;
  passiveName?: string;
  passiveDescription?: string;
  description?: string;
  imageUrl?: string;
}

@Injectable()
export class ItemScraper extends BaseScraper {
  protected readonly logger = new Logger(ItemScraper.name);
  protected readonly source = 'mlbb-items';

  constructor(
    prisma: PrismaService,
    browser: StealthBrowser,
    rateLimiter: ScraperRateLimiter,
    circuitBreaker: CircuitBreaker,
  ) {
    super(prisma, browser, rateLimiter, circuitBreaker);
  }

  async scrape(): Promise<number> {
    this.logger.log('Starting item data scrape...');

    const itemsData = await this.fetchItems();
    let recordsAffected = 0;

    for (const itemData of itemsData) {
      const slug = this.slugify(itemData.name);
      const type = this.normalizeItemType(itemData.type);

      await this.prisma.item.upsert({
        where: { slug },
        update: {
          name: itemData.name,
          type,
          category: itemData.category || null,
          price: itemData.price || 0,
          stats: itemData.stats || null,
          passiveName: itemData.passiveName || null,
          passiveDescription: itemData.passiveDescription || null,
          description: itemData.description || null,
          imageUrl: itemData.imageUrl || null,
        },
        create: {
          name: itemData.name,
          slug,
          type,
          category: itemData.category || null,
          price: itemData.price || 0,
          stats: itemData.stats || null,
          passiveName: itemData.passiveName || null,
          passiveDescription: itemData.passiveDescription || null,
          description: itemData.description || null,
          imageUrl: itemData.imageUrl || null,
        },
      });
      recordsAffected++;
    }

    this.logger.log(`Item scrape completed: ${recordsAffected} records affected`);
    return recordsAffected;
  }

  private async fetchItems(): Promise<RawItemData[]> {
    try {
      const html = await this.fetchPage('https://m.mobilelegends.com/en/item');
      return this.parseItemsHtml(html);
    } catch (error) {
      this.logger.warn(`Item source failed: ${error.message}`);
      return [];
    }
  }

  private parseItemsHtml(html: string): RawItemData[] {
    const items: RawItemData[] = [];

    // Try JSON extraction first
    const jsonMatch = html.match(/itemList\s*[:=]\s*(\[[\s\S]*?\]);/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed.map((item: any) => ({
          name: item.name,
          type: item.type || item.category || 'Attack',
          price: item.price || item.cost || 0,
          description: item.desc || item.description,
          imageUrl: item.icon || item.img,
          passiveName: item.passive_name,
          passiveDescription: item.passive_desc,
        }));
      } catch { /* ignore */ }
    }

    // Regex-based parsing fallback
    const itemBlocks = html.match(/<div[^>]*class="[^"]*item-card[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi) || [];
    for (const block of itemBlocks) {
      const nameMatch = block.match(/class="[^"]*item-name[^"]*"[^>]*>([^<]+)/i);
      const typeMatch = block.match(/data-type="([^"]+)"/i);
      const priceMatch = block.match(/([\d,]+)\s*(?:gold|$)/i);
      const imgMatch = block.match(/src="([^"]+)"/i);

      if (nameMatch) {
        items.push({
          name: nameMatch[1].trim(),
          type: typeMatch ? typeMatch[1] : 'Attack',
          price: priceMatch ? parseInt(priceMatch[1].replace(',', '')) : 0,
          imageUrl: imgMatch ? imgMatch[1] : undefined,
        });
      }
    }

    return items;
  }

  private normalizeItemType(type?: string): any {
    if (!type) return 'Attack';
    const map: Record<string, string> = {
      attack: 'Attack',
      physical: 'Attack',
      magic: 'Magic',
      defense: 'Defense',
      movement: 'Movement',
      jungle: 'Jungle',
      roam: 'Roam',
    };
    return map[type.toLowerCase()] || 'Attack';
  }
}
