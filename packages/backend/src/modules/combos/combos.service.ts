import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class CombosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number = 1, perPage: number = 20) {
    const skip = (page - 1) * perPage;

    const [combos, total] = await Promise.all([
      this.prisma.heroCombo.findMany({
        skip,
        take: perPage,
        orderBy: { synergyScore: 'desc' },
        include: {
          heroes: {
            include: {
              hero: {
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
          },
        },
      }),
      this.prisma.heroCombo.count(),
    ]);

    const data = combos.map((combo) => ({
      id: combo.id,
      name: combo.name,
      description: combo.description,
      strategy: combo.strategy,
      difficulty: combo.difficulty,
      synergyScore: combo.synergyScore,
      heroes: combo.heroes.map((ch) => ({
        ...ch.hero,
        roleInCombo: ch.roleInCombo,
      })),
      createdAt: combo.createdAt,
      updatedAt: combo.updatedAt,
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

  async findById(id: number) {
    const combo = await this.prisma.heroCombo.findUnique({
      where: { id },
      include: {
        heroes: {
          include: {
            hero: {
              select: {
                id: true,
                name: true,
                slug: true,
                role: true,
                lane: true,
                iconUrl: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!combo) {
      throw new NotFoundException(`Combo with ID ${id} not found`);
    }

    const data = {
      id: combo.id,
      name: combo.name,
      description: combo.description,
      strategy: combo.strategy,
      difficulty: combo.difficulty,
      synergyScore: combo.synergyScore,
      heroes: combo.heroes.map((ch) => ({
        ...ch.hero,
        roleInCombo: ch.roleInCombo,
      })),
      createdAt: combo.createdAt,
      updatedAt: combo.updatedAt,
    };

    return { success: true, data };
  }
}
