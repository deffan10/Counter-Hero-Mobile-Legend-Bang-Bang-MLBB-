import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(type?: string, page: number = 1, perPage: number = 20) {
    const skip = (page - 1) * perPage;

    const where: any = { isActive: true };
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { name: 'asc' },
      }),
      this.prisma.item.count({ where }),
    ]);

    return {
      success: true,
      data: items,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async findBySlug(slug: string) {
    const item = await this.prisma.item.findUnique({
      where: { slug },
    });

    if (!item) {
      throw new NotFoundException(`Item with slug "${slug}" not found`);
    }

    return { success: true, data: item };
  }
}
