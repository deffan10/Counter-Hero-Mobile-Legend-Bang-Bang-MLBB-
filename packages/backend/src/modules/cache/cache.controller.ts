import { Controller, Get, Post, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CacheService } from './cache.service';

@ApiTags('Admin - Cache')
@Controller('admin/cache')
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get Redis cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics returned successfully' })
  async getStats() {
    try {
      const stats = await this.cacheService.getStats();
      return {
        usedMemory: stats.usedMemory,
        totalKeys: stats.totalKeys,
        connectedClients: stats.connectedClients,
        hitRate: null, // Placeholder - can be implemented with Redis INFO stats
        missRate: null,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve cache stats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('flush/:pattern')
  @ApiOperation({ summary: 'Flush cache keys matching a pattern' })
  @ApiParam({ name: 'pattern', description: 'Cache key pattern to flush (e.g., mlbb:v1:heroes:*)' })
  @ApiResponse({ status: 200, description: 'Cache keys flushed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid pattern' })
  async flushPattern(@Param('pattern') pattern: string) {
    if (!pattern || pattern.trim().length === 0) {
      throw new HttpException('Pattern is required', HttpStatus.BAD_REQUEST);
    }

    // Decode the pattern (may be URL-encoded)
    const decodedPattern = decodeURIComponent(pattern);

    // Safety check: prevent flushing everything without explicit pattern
    if (decodedPattern === '*') {
      throw new HttpException(
        'Cannot flush all keys. Use a more specific pattern.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const deletedCount = await this.cacheService.invalidatePattern(decodedPattern);
      return {
        deletedCount,
        pattern: decodedPattern,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to flush cache pattern',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
