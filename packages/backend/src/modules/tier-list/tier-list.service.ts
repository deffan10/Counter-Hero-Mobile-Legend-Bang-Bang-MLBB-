import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class TierListService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(rankTier?: string, role?: string, page: number = 1, perPage: number = 20) {
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (rankTier) where.rankTier = rankTier;
    if (role) where.roleContext = role;

    const [tierEntries, total] = await Promise.all([
      this.prisma.tierList.findMany({
        where,
        skip,
        take: perPage,
        orderBy: [{ tier: 'asc' }, { heroId: 'asc' }],
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
      }),
      this.prisma.tierList.count({ where }),
    ]);

    return {
      success: true,
      data: tierEntries,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }
}
