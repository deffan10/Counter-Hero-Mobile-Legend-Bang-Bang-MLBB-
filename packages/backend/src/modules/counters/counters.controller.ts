import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiNotFoundResponse } from '@nestjs/swagger';
import { CountersService } from './counters.service';

@ApiTags('Counters')
@Controller('counters')
export class CountersController {
  constructor(private readonly countersService: CountersService) {}

  @Get(':heroSlug')
  @ApiOperation({ summary: 'Get counters for a hero by slug' })
  @ApiParam({ name: 'heroSlug', description: 'Hero slug identifier' })
  @ApiOkResponse({ description: 'List of counter heroes ordered by effectiveness' })
  @ApiNotFoundResponse({ description: 'Hero not found' })
  findCountersForHero(@Param('heroSlug') heroSlug: string) {
    return this.countersService.findCountersForHero(heroSlug);
  }

  @Get('matchup/:hero1/:hero2')
  @ApiOperation({ summary: 'Get matchup data between two heroes' })
  @ApiParam({ name: 'hero1', description: 'First hero slug' })
  @ApiParam({ name: 'hero2', description: 'Second hero slug' })
  @ApiOkResponse({ description: 'Matchup information between two heroes' })
  @ApiNotFoundResponse({ description: 'One or both heroes not found' })
  findMatchup(@Param('hero1') hero1: string, @Param('hero2') hero2: string) {
    return this.countersService.findMatchup(hero1, hero2);
  }
}
