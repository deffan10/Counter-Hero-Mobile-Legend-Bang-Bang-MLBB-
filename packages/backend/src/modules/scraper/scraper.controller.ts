import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ScraperService, ScrapeJobType } from './scraper.service';

@ApiTags('Admin - Scraper')
@Controller('admin/scrape')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get scraper queue status and recent logs' })
  getStatus() {
    return this.scraperService.getStatus();
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get scrape logs (paginated)' })
  getLogs(@Query('page') page?: number, @Query('perPage') perPage?: number) {
    return this.scraperService.getLogs(page || 1, perPage || 20);
  }

  @Post('trigger/:jobType')
  @ApiOperation({ summary: 'Manually trigger a scrape job' })
  @ApiParam({ name: 'jobType', enum: ['heroes', 'stats', 'items', 'spells', 'counters', 'tier-list'] })
  triggerScrape(@Param('jobType') jobType: ScrapeJobType) {
    return this.scraperService.triggerManualScrape(jobType);
  }
}
