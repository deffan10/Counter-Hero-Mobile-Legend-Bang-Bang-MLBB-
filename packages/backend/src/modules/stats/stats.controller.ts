import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiQuery, ApiNotFoundResponse } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('Stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('winrate')
  @ApiOperation({ summary: 'Get hero winrate rankings' })
  @ApiQuery({ name: 'rankTier', required: false, description: 'Filter by rank tier (All, Mythic, Legend, Epic, Grandmaster)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'perPage', required: false, description: 'Items per page', example: 20 })
  @ApiOkResponse({ description: 'Heroes ranked by winrate descending' })
  getWinrate(
    @Query('rankTier') rankTier?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.statsService.getWinrate(
      rankTier,
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 20,
    );
  }

  @Get('pickrate')
  @ApiOperation({ summary: 'Get hero pickrate rankings' })
  @ApiQuery({ name: 'rankTier', required: false, description: 'Filter by rank tier (All, Mythic, Legend, Epic, Grandmaster)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'perPage', required: false, description: 'Items per page', example: 20 })
  @ApiOkResponse({ description: 'Heroes ranked by pickrate descending' })
  getPickrate(
    @Query('rankTier') rankTier?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.statsService.getPickrate(
      rankTier,
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 20,
    );
  }

  @Get('banrate')
  @ApiOperation({ summary: 'Get hero banrate rankings' })
  @ApiQuery({ name: 'rankTier', required: false, description: 'Filter by rank tier (All, Mythic, Legend, Epic, Grandmaster)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'perPage', required: false, description: 'Items per page', example: 20 })
  @ApiOkResponse({ description: 'Heroes ranked by banrate descending' })
  getBanrate(
    @Query('rankTier') rankTier?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.statsService.getBanrate(
      rankTier,
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 20,
    );
  }

  @Get('trends/:heroSlug')
  @ApiOperation({ summary: 'Get stat trends over time for a hero' })
  @ApiParam({ name: 'heroSlug', description: 'Hero slug identifier' })
  @ApiQuery({ name: 'rankTier', required: false, description: 'Filter by rank tier (All, Mythic, Legend, Epic, Grandmaster)' })
  @ApiOkResponse({ description: 'Historical stat trends for the hero' })
  @ApiNotFoundResponse({ description: 'Hero not found' })
  getTrends(
    @Param('heroSlug') heroSlug: string,
    @Query('rankTier') rankTier?: string,
  ) {
    return this.statsService.getTrends(heroSlug, rankTier);
  }
}
