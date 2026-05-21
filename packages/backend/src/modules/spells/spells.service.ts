import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class SpellsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number = 1, perPage: number = 20) {
    const skip = (page - 1) * perPage;

    const [spells, total] = await Promise.all([
      this.prisma.battleSpell.findMany({
        where: { isActive: true },
        skip,
        take: perPage,
        orderBy: { name: 'asc' },
      }),
      this.prisma.battleSpell.count({ where: { isActive: true } }),
    ]);

    return {
      success: true,
      data: spells,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async findBySlug(slug: string) {
    const spell = await this.prisma.battleSpell.findUnique({
      where: { slug },
    });

    if (!spell) {
      throw new NotFoundException(`Spell with slug "${slug}" not found`);
    }

    return { success: true, data: spell };
  }

  async findRecommendedForHero(heroSlug: string) {
    const hero = await this.prisma.hero.findUnique({
      where: { slug: heroSlug },
      select: { id: true, name: true, slug: true, role: true },
    });

    if (!hero) {
      throw new NotFoundException(`Hero with slug "${heroSlug}" not found`);
    }

    const recommendations = await this.prisma.heroSpellRec.findMany({
      where: { heroId: hero.id },
      orderBy: { priority: 'asc' },
      include: {
        spell: true,
      },
    });

    return {
      success: true,
      data: {
        hero,
        recommendations: recommendations.map((rec) => ({
          spell: rec.spell,
          priority: rec.priority,
          explanation: rec.explanation,
          situation: rec.situation,
        })),
      },
    };
  }
}
