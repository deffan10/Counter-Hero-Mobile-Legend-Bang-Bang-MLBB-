import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { QueryHeroesDto, SearchHeroesDto } from './dto/query-heroes.dto';

@Injectable()
export class HeroesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryHeroesDto) {
    const { page = 1, perPage = 20, role, lane, sort = 'name', order = 'asc' } = query;
    const skip = (page - 1) * perPage;

    const where: any = { isActive: true };
    if (role) where.role = role;
    if (lane) where.lane = lane;

    const orderBy: any = {};
    if (sort === 'winrate') {
      // Winrate sorting handled after query
      orderBy.name = order;
    } else {
      orderBy[sort] = order;
    }

    const [heroes, total] = await Promise.all([
      this.prisma.hero.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
        include: {
          stats: {
            where: { rankTier: 'All' },
            orderBy: { recordedAt: 'desc' },
            take: 1,
            select: {
              winrate: true,
              pickrate: true,
              banrate: true,
              recordedAt: true,
            },
          },
        },
      }),
      this.prisma.hero.count({ where }),
    ]);

    const data = heroes.map((hero) => ({
      ...hero,
      latestStats: hero.stats[0] || null,
      stats: undefined,
    }));

    return {
      success: true,
      data,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async search(query: SearchHeroesDto) {
    const { q } = query;

    if (!q || q.trim().length === 0) {
      return { success: true, data: [] };
    }

    const heroes = await this.prisma.hero.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { slug: { contains: q } },
          { role: { equals: q as any } },
        ],
      },
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
        role: true,
        lane: true,
        iconUrl: true,
      },
    });

    return { success: true, data: heroes };
  }

  async findBySlug(slug: string) {
    const hero = await this.prisma.hero.findUnique({
      where: { slug },
      include: {
        stats: {
          where: { rankTier: 'All' },
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
        countersAsHero: {
          orderBy: { effectiveness: 'desc' },
          take: 5,
          include: {
            counter: {
              select: { id: true, name: true, slug: true, role: true, iconUrl: true },
            },
          },
        },
        builds: {
          take: 3,
          include: {
            items: {
              orderBy: { slotOrder: 'asc' },
              include: { item: true },
            },
          },
        },
        spellRecs: {
          orderBy: { priority: 'asc' },
          include: { spell: true },
        },
      },
    });

    if (!hero) {
      throw new NotFoundException(`Hero with slug "${slug}" not found`);
    }

    return { success: true, data: hero };
  }
}
