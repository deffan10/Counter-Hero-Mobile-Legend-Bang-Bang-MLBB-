import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { PrismaService } from '../../shared/prisma/prisma.service';

export type ScrapeJobType = 'heroes' | 'stats' | 'items' | 'spells' | 'counters' | 'tier-list';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    @InjectQueue('scraper') private readonly scraperQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  // Every 6 hours - Hero data
  @Cron('0 */6 * * *')
  async scheduleHeroScrape() {
    this.logger.log('Scheduling hero data scrape...');
    await this.addJob('heroes', { priority: 2 });
  }

  // Every 2 hours - Stats (winrate/pickrate/banrate)
  @Cron('0 */2 * * *')
  async scheduleStatsScrape() {
    this.logger.log('Scheduling stats scrape...');
    await this.addJob('stats', { priority: 1 });
  }

  // Every 12 hours - Items
  @Cron('0 */12 * * *')
  async scheduleItemsScrape() {
    this.logger.log('Scheduling items scrape...');
    await this.addJob('items', { priority: 3 });
  }

  // Daily - Spells
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async scheduleSpellsScrape() {
    this.logger.log('Scheduling spells scrape...');
    await this.addJob('spells', { priority: 4 });
  }

  // Every 4 hours - Counter data
  @Cron('0 */4 * * *')
  async scheduleCounterScrape() {
    this.logger.log('Scheduling counter data scrape...');
    await this.addJob('counters', { priority: 2 });
  }

  // Every 4 hours - Tier list
  @Cron('30 */4 * * *')
  async scheduleTierListScrape() {
    this.logger.log('Scheduling tier list scrape...');
    await this.addJob('tier-list', { priority: 2 });
  }

  async addJob(jobType: ScrapeJobType, options: { priority?: number } = {}) {
    const logEntry = await this.prisma.scrapeLog.create({
      data: {
        source: 'mlbb-official',
        jobType,
        status: 'pending',
      },
    });

    await this.scraperQueue.add(
      jobType,
      { jobType, logId: Number(logEntry.id) },
      {
        priority: options.priority || 3,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    return logEntry;
  }

  async triggerManualScrape(jobType: ScrapeJobType) {
    this.logger.log(`Manual scrape triggered: ${jobType}`);
    return this.addJob(jobType, { priority: 1 });
  }

  async getStatus() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.scraperQueue.getWaitingCount(),
      this.scraperQueue.getActiveCount(),
      this.scraperQueue.getCompletedCount(),
      this.scraperQueue.getFailedCount(),
    ]);

    const recentLogs = await this.prisma.scrapeLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      queue: { waiting, active, completed, failed },
      recentLogs,
    };
  }

  async getLogs(page: number = 1, perPage: number = 20) {
    const skip = (page - 1) * perPage;
    const [logs, total] = await Promise.all([
      this.prisma.scrapeLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.scrapeLog.count(),
    ]);

    return {
      success: true,
      data: logs,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }
}
