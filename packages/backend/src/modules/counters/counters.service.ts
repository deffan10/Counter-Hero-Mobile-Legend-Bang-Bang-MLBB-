import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class CountersService {
  constructor(private readonly prisma: PrismaService) {}

  async findCountersForHero(heroSlug: string) {
    const hero = await this.prisma.hero.findUnique({
      where: { slug: heroSlug },
      select: { id: true, name: true, slug: true, role: true },
    });

    if (!hero) {
      throw new NotFoundException(`Hero with slug "${heroSlug}" not found`);
    }

    const counters = await this.prisma.heroCounter.findMany({
      where: { heroId: hero.id },
      orderBy: { effectiveness: 'desc' },
      include: {
        counter: {
          select: {
            id: true,
            name: true,
            slug: true,
            role: true,
            lane: true,
            iconUrl: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        hero,
        counters: counters.map((c) => ({
          id: c.id,
          hero: c.counter,
          effectiveness: c.effectiveness,
          explanation: c.explanation,
          tips: c.tips,
          source: c.source,
        })),
      },
    };
  }

  async findMatchup(hero1Slug: string, hero2Slug: string) {
    const [hero1, hero2] = await Promise.all([
      this.prisma.hero.findUnique({
        where: { slug: hero1Slug },
        select: { id: true, name: true, slug: true, role: true, iconUrl: true },
      }),
      this.prisma.hero.findUnique({
        where: { slug: hero2Slug },
        select: { id: true, name: true, slug: true, role: true, iconUrl: true },
      }),
    ]);

    if (!hero1) {
      throw new NotFoundException(`Hero with slug "${hero1Slug}" not found`);
    }
    if (!hero2) {
      throw new NotFoundException(`Hero with slug "${hero2Slug}" not found`);
    }

    const [counterData1, counterData2] = await Promise.all([
      this.prisma.heroCounter.findUnique({
        where: { heroId_counterId: { heroId: hero1.id, counterId: hero2.id } },
      }),
      this.prisma.heroCounter.findUnique({
        where: { heroId_counterId: { heroId: hero2.id, counterId: hero1.id } },
      }),
    ]);

    return {
      success: true,
      data: {
        hero1: {
          ...hero1,
          countersHero2: counterData1
            ? {
                effectiveness: counterData1.effectiveness,
                explanation: counterData1.explanation,
                tips: counterData1.tips,
              }
            : null,
        },
        hero2: {
          ...hero2,
          countersHero1: counterData2
            ? {
                effectiveness: counterData2.effectiveness,
                explanation: counterData2.explanation,
                tips: counterData2.tips,
              }
            : null,
        },
      },
    };
  }
}
