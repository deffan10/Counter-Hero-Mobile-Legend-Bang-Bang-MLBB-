import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { TierListService } from './tier-list.service';

@ApiTags('Tier List')
@Controller('tier-list')
export class TierListController {
  constructor(private readonly tierListService: TierListService) {}

  @Get()
  @ApiOperation({ summary: 'Get tier list with optional rank and role filters' })
  @ApiQuery({ name: 'rankTier', required: false, description: 'Filter by rank tier (All, Mythic, Legend, Epic, Grandmaster)' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role context' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'perPage', required: false, description: 'Items per page', example: 20 })
  @ApiOkResponse({ description: 'Tier list entries with hero data' })
  findAll(
    @Query('rankTier') rankTier?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.tierListService.findAll(
      rankTier,
      role,
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 20,
    );
  }
}
