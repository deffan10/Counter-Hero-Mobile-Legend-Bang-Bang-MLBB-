import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWinrate(rankTier?: string, page: number = 1, perPage: number = 20) {
    const skip = (page - 1) * perPage;
    const tier = rankTier || 'All';

    const heroes = await this.prisma.hero.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        role: true,
        lane: true,
        iconUrl: true,
        stats: {
          where: { rankTier: tier as any },
          orderBy: { recordedAt: 'desc' },
          take: 1,
          select: { winrate: true, recordedAt: true },
        },
      },
    });

    const heroesWithStats = heroes
      .filter((h) => h.stats.length > 0 && h.stats[0].winrate !== null)
      .map((h) => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
        role: h.role,
        lane: h.lane,
        iconUrl: h.iconUrl,
        winrate: h.stats[0].winrate,
        recordedAt: h.stats[0].recordedAt,
      }))
      .sort((a, b) => Number(b.winrate) - Number(a.winrate));

    const total = heroesWithStats.length;
    const paginatedData = heroesWithStats.slice(skip, skip + perPage);

    return {
      success: true,
      data: paginatedData,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getPickrate(rankTier?: string, page: number = 1, perPage: number = 20) {
    const skip = (page - 1) * perPage;
    const tier = rankTier || 'All';

    const heroes = await this.prisma.hero.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        role: true,
        lane: true,
        iconUrl: true,
        stats: {
          where: { rankTier: tier as any },
          orderBy: { recordedAt: 'desc' },
          take: 1,
          select: { pickrate: true, recordedAt: true },
        },
      },
    });

    const heroesWithStats = heroes
      .filter((h) => h.stats.length > 0 && h.stats[0].pickrate !== null)
      .map((h) => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
        role: h.role,
        lane: h.lane,
        iconUrl: h.iconUrl,
        pickrate: h.stats[0].pickrate,
        recordedAt: h.stats[0].recordedAt,
      }))
      .sort((a, b) => Number(b.pickrate) - Number(a.pickrate));

    const total = heroesWithStats.length;
    const paginatedData = heroesWithStats.slice(skip, skip + perPage);

    return {
      success: true,
      data: paginatedData,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getBanrate(rankTier?: string, page: number = 1, perPage: number = 20) {
    const skip = (page - 1) * perPage;
    const tier = rankTier || 'All';

    const heroes = await this.prisma.hero.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        role: true,
        lane: true,
        iconUrl: true,
        stats: {
          where: { rankTier: tier as any },
          orderBy: { recordedAt: 'desc' },
          take: 1,
          select: { banrate: true, recordedAt: true },
        },
      },
    });

    const heroesWithStats = heroes
      .filter((h) => h.stats.length > 0 && h.stats[0].banrate !== null)
      .map((h) => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
        role: h.role,
        lane: h.lane,
        iconUrl: h.iconUrl,
        banrate: h.stats[0].banrate,
        recordedAt: h.stats[0].recordedAt,
      }))
      .sort((a, b) => Number(b.banrate) - Number(a.banrate));

    const total = heroesWithStats.length;
    const paginatedData = heroesWithStats.slice(skip, skip + perPage);

    return {
      success: true,
      data: paginatedData,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getTrends(heroSlug: string, rankTier?: string) {
    const hero = await this.prisma.hero.findUnique({
      where: { slug: heroSlug },
      select: { id: true, name: true, slug: true, role: true },
    });

    if (!hero) {
      throw new NotFoundException(`Hero with slug "${heroSlug}" not found`);
    }

    const tier = rankTier || 'All';

    const stats = await this.prisma.heroStats.findMany({
      where: {
        heroId: hero.id,
        rankTier: tier as any,
      },
      orderBy: { recordedAt: 'asc' },
      select: {
        winrate: true,
        pickrate: true,
        banrate: true,
        patchVersion: true,
        recordedAt: true,
      },
    });

    return {
      success: true,
      data: {
        hero,
        rankTier: tier,
        trends: stats,
      },
    };
  }
}
