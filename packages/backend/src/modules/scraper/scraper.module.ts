import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ScraperService } from './scraper.service';
import { ScraperProcessor } from './scraper.processor';
import { ScraperController } from './scraper.controller';
import { HeroScraper } from './scrapers/hero.scraper';
import { StatsScraper } from './scrapers/stats.scraper';
import { ItemScraper } from './scrapers/item.scraper';
import { SpellScraper } from './scrapers/spell.scraper';
import { ProxyRotator } from './utils/proxy-rotator';
import { ScraperRateLimiter } from './utils/rate-limiter';
import { CircuitBreaker } from './utils/circuit-breaker';
import { StealthBrowser } from './utils/stealth';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue(
      { name: 'scraper' },
      { name: 'scraper-stats' },
      { name: 'scraper-heroes' },
      { name: 'scraper-items' },
    ),
    CacheModule,
  ],
  controllers: [ScraperController],
  providers: [
    ScraperService,
    ScraperProcessor,
    HeroScraper,
    StatsScraper,
    ItemScraper,
    SpellScraper,
    ProxyRotator,
    ScraperRateLimiter,
    CircuitBreaker,
    StealthBrowser,
  ],
  exports: [ScraperService],
})
export class ScraperModule {}
