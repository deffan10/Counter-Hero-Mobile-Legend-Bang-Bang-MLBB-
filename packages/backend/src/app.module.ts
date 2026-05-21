import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './shared/prisma/prisma.module';
import { HeroesModule } from './modules/heroes/heroes.module';
import { CountersModule } from './modules/counters/counters.module';
import { ItemsModule } from './modules/items/items.module';
import { SpellsModule } from './modules/spells/spells.module';
import { StatsModule } from './modules/stats/stats.module';
import { TierListModule } from './modules/tier-list/tier-list.module';
import { CombosModule } from './modules/combos/combos.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 100 },
    ]),
    PrismaModule,
    HealthModule,
    HeroesModule,
    CountersModule,
    ItemsModule,
    SpellsModule,
    StatsModule,
    TierListModule,
    CombosModule,
  ],
})
export class AppModule {}
