import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiNotFoundResponse } from '@nestjs/swagger';
import { HeroesService } from './heroes.service';
import { QueryHeroesDto, SearchHeroesDto } from './dto/query-heroes.dto';

@ApiTags('Heroes')
@Controller('heroes')
export class HeroesController {
  constructor(private readonly heroesService: HeroesService) {}

  @Get()
  @ApiOperation({ summary: 'List all heroes with pagination and filters' })
  @ApiOkResponse({ description: 'Paginated list of heroes with latest stats' })
  findAll(@Query() query: QueryHeroesDto) {
    return this.heroesService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search heroes by name, slug, or role' })
  @ApiOkResponse({ description: 'List of matching heroes' })
  search(@Query() query: SearchHeroesDto) {
    return this.heroesService.search(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get hero detail by slug' })
  @ApiParam({ name: 'slug', description: 'Hero slug identifier' })
  @ApiOkResponse({ description: 'Hero detail with counters, builds, and spells' })
  @ApiNotFoundResponse({ description: 'Hero not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.heroesService.findBySlug(slug);
  }
}
