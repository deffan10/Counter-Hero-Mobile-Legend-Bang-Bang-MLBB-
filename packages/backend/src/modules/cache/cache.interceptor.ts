import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: CacheService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Build cache key from URL + query params
    const cacheKey = this.cacheService.buildKey(
      'http',
      request.url.replace(/[?&]/g, ':'),
    );

    // Check cache
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) {
      // Add cache hit header
      const response = context.switchToHttp().getResponse();
      response.setHeader('X-Cache', 'HIT');
      return of({
        ...cached,
        cache: { hit: true, cachedAt: cached._cachedAt },
      });
    }

    // Miss - execute handler and cache result
    return next.handle().pipe(
      tap(async (data) => {
        if (data && data.success !== false) {
          const ttl = this.getTtlForPath(request.path);
          await this.cacheService.set(
            cacheKey,
            { ...data, _cachedAt: new Date().toISOString() },
            ttl,
          );
          const response = context.switchToHttp().getResponse();
          response.setHeader('X-Cache', 'MISS');
        }
      }),
    );
  }

  private getTtlForPath(path: string): number {
    if (path.includes('/stats')) return 900;       // 15 min
    if (path.includes('/counter')) return 1800;    // 30 min
    if (path.includes('/tier-list')) return 3600;  // 1 hour
    if (path.includes('/heroes')) return 3600;     // 1 hour
    if (path.includes('/items')) return 21600;     // 6 hours
    if (path.includes('/spells')) return 43200;    // 12 hours
    if (path.includes('/combos')) return 7200;     // 2 hours
    return 1800; // 30 min default
  }
}
