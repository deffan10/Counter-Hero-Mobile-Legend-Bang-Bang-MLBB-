import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiQuery, ApiNotFoundResponse } from '@nestjs/swagger';
import { ItemsService } from './items.service';

@ApiTags('Items')
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List all items with optional type filter' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by item type (Attack, Magic, Defense, Movement, Jungle, Roam)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'perPage', required: false, description: 'Items per page', example: 20 })
  @ApiOkResponse({ description: 'Paginated list of items' })
  findAll(
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.itemsService.findAll(
      type,
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 20,
    );
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get item detail by slug' })
  @ApiParam({ name: 'slug', description: 'Item slug identifier' })
  @ApiOkResponse({ description: 'Item detail' })
  @ApiNotFoundResponse({ description: 'Item not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.itemsService.findBySlug(slug);
  }
}
