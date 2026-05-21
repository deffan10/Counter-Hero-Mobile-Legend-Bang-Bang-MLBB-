import { Injectable, Logger } from '@nestjs/common';

interface RateLimitEntry {
  lastRequest: number;
  requestCount: number;
  windowStart: number;
}

@Injectable()
export class ScraperRateLimiter {
  private readonly logger = new Logger(ScraperRateLimiter.name);
  private limits = new Map<string, RateLimitEntry>();

  // Default: 1 request per 2 seconds per source
  private readonly minInterval = 2000;
  // Max 30 requests per minute per source
  private readonly maxPerMinute = 30;
  private readonly windowMs = 60000;

  async waitForSlot(source: string): Promise<void> {
    const entry = this.limits.get(source) || {
      lastRequest: 0,
      requestCount: 0,
      windowStart: Date.now(),
    };

    const now = Date.now();

    // Reset window if expired
    if (now - entry.windowStart > this.windowMs) {
      entry.requestCount = 0;
      entry.windowStart = now;
    }

    // Check per-minute limit
    if (entry.requestCount >= this.maxPerMinute) {
      const waitTime = this.windowMs - (now - entry.windowStart);
      this.logger.debug(
        `Rate limit reached for ${source}. Waiting ${waitTime}ms`,
      );
      await this.sleep(waitTime);
      entry.requestCount = 0;
      entry.windowStart = Date.now();
    }

    // Enforce minimum interval between requests
    const elapsed = now - entry.lastRequest;
    if (elapsed < this.minInterval) {
      const waitTime = this.minInterval - elapsed;
      await this.sleep(waitTime);
    }

    entry.lastRequest = Date.now();
    entry.requestCount++;
    this.limits.set(source, entry);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getStats() {
    const stats: Record<string, { requestCount: number; lastRequest: string }> = {};
    for (const [source, entry] of this.limits) {
      stats[source] = {
        requestCount: entry.requestCount,
        lastRequest: new Date(entry.lastRequest).toISOString(),
      };
    }
    return stats;
  }
}
