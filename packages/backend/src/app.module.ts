import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './shared/prisma/prisma.module';
import { CacheModule } from './modules/cache/cache.module';
import { HeroesModule } from './modules/heroes/heroes.module';
import { CountersModule } from './modules/counters/counters.module';
import { ItemsModule } from './modules/items/items.module';
import { SpellsModule } from './modules/spells/spells.module';
import { StatsModule } from './modules/stats/stats.module';
import { TierListModule } from './modules/tier-list/tier-list.module';
import { CombosModule } from './modules/combos/combos.module';
import { HealthModule } from './modules/health/health.module';
import { ScraperModule } from './modules/scraper/scraper.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 100 },
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: new URL(config.get('REDIS_URL', 'redis://localhost:6379')).hostname,
          port: parseInt(new URL(config.get('REDIS_URL', 'redis://localhost:6379')).port || '6379'),
        },
      }),
    }),
    PrismaModule,
    CacheModule,
    HealthModule,
    HeroesModule,
    CountersModule,
    ItemsModule,
    SpellsModule,
    StatsModule,
    TierListModule,
    CombosModule,
    ScraperModule,
  ],
})
export class AppModule {}
