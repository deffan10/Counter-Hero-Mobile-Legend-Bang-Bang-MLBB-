import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { HeroScraper } from './scrapers/hero.scraper';
import { StatsScraper } from './scrapers/stats.scraper';
import { ItemScraper } from './scrapers/item.scraper';
import { SpellScraper } from './scrapers/spell.scraper';
import { CacheService } from '../cache/cache.service';

@Processor('scraper', { concurrency: 3 })
export class ScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(ScraperProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly heroScraper: HeroScraper,
    private readonly statsScraper: StatsScraper,
    private readonly itemScraper: ItemScraper,
    private readonly spellScraper: SpellScraper,
    private readonly cacheService: CacheService,
  ) {
    super();
  }

  async process(job: Job<{ jobType: string; logId: number }>) {
    const { jobType, logId } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing scrape job: ${jobType} (logId: ${logId})`);

    // Update log status to running
    await this.prisma.scrapeLog.update({
      where: { id: BigInt(logId) },
      data: { status: 'running', startedAt: new Date() },
    });

    try {
      let recordsAffected = 0;

      switch (jobType) {
        case 'heroes':
          recordsAffected = await this.heroScraper.scrape();
          await this.cacheService.invalidatePattern('mlbb:v1:hero:*');
          break;
        case 'stats':
          recordsAffected = await this.statsScraper.scrape();
          await this.cacheService.invalidatePattern('mlbb:v1:stats:*');
          break;
        case 'items':
          recordsAffected = await this.itemScraper.scrape();
          await this.cacheService.invalidatePattern('mlbb:v1:item:*');
          break;
        case 'spells':
          recordsAffected = await this.spellScraper.scrape();
          await this.cacheService.invalidatePattern('mlbb:v1:spell:*');
          break;
        case 'counters':
          recordsAffected = await this.heroScraper.scrapeCounters();
          await this.cacheService.invalidatePattern('mlbb:v1:counter:*');
          break;
        case 'tier-list':
          recordsAffected = await this.statsScraper.scrapeTierList();
          await this.cacheService.invalidatePattern('mlbb:v1:tierlist:*');
          break;
        default:
          throw new Error(`Unknown job type: ${jobType}`);
      }

      const durationMs = Date.now() - startTime;

      await this.prisma.scrapeLog.update({
        where: { id: BigInt(logId) },
        data: {
          status: 'completed',
          recordsAffected,
          durationMs,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Scrape completed: ${jobType} - ${recordsAffected} records in ${durationMs}ms`);
      return { recordsAffected, durationMs };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.scrapeLog.update({
        where: { id: BigInt(logId) },
        data: {
          status: 'failed',
          errorMessage,
          durationMs,
          completedAt: new Date(),
        },
      });

      this.logger.error(`Scrape failed: ${jobType} - ${errorMessage}`);
      throw error;
    }
  }
}
