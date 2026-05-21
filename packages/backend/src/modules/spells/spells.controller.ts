import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiQuery, ApiNotFoundResponse } from '@nestjs/swagger';
import { SpellsService } from './spells.service';

@ApiTags('Spells')
@Controller('spells')
export class SpellsController {
  constructor(private readonly spellsService: SpellsService) {}

  @Get()
  @ApiOperation({ summary: 'List all battle spells' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'perPage', required: false, description: 'Items per page', example: 20 })
  @ApiOkResponse({ description: 'Paginated list of battle spells' })
  findAll(@Query('page') page?: string, @Query('perPage') perPage?: string) {
    return this.spellsService.findAll(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 20,
    );
  }

  @Get('recommended/:heroSlug')
  @ApiOperation({ summary: 'Get recommended spells for a hero' })
  @ApiParam({ name: 'heroSlug', description: 'Hero slug identifier' })
  @ApiOkResponse({ description: 'Recommended spells for the hero' })
  @ApiNotFoundResponse({ description: 'Hero not found' })
  findRecommended(@Param('heroSlug') heroSlug: string) {
    return this.spellsService.findRecommendedForHero(heroSlug);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get spell detail by slug' })
  @ApiParam({ name: 'slug', description: 'Spell slug identifier' })
  @ApiOkResponse({ description: 'Spell detail' })
  @ApiNotFoundResponse({ description: 'Spell not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.spellsService.findBySlug(slug);
  }
}
