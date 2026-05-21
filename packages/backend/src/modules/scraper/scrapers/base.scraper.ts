import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { StealthBrowser } from '../utils/stealth';
import { ScraperRateLimiter } from '../utils/rate-limiter';
import { CircuitBreaker } from '../utils/circuit-breaker';

export abstract class BaseScraper {
  protected abstract readonly logger: Logger;
  protected abstract readonly source: string;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly browser: StealthBrowser,
    protected readonly rateLimiter: ScraperRateLimiter,
    protected readonly circuitBreaker: CircuitBreaker,
  ) {}

  protected async fetchPage(url: string): Promise<string> {
    await this.rateLimiter.waitForSlot(this.source);

    if (!this.circuitBreaker.isAvailable(this.source)) {
      throw new Error(`Circuit breaker OPEN for source: ${this.source}`);
    }

    try {
      const html = await this.browser.fetchPage(url);
      this.circuitBreaker.recordSuccess(this.source);
      return html;
    } catch (error) {
      this.circuitBreaker.recordFailure(this.source);
      throw error;
    }
  }

  protected async fetchJson<T>(url: string): Promise<T> {
    await this.rateLimiter.waitForSlot(this.source);

    if (!this.circuitBreaker.isAvailable(this.source)) {
      throw new Error(`Circuit breaker OPEN for source: ${this.source}`);
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as T;
      this.circuitBreaker.recordSuccess(this.source);
      return data;
    } catch (error) {
      this.circuitBreaker.recordFailure(this.source);
      throw error;
    }
  }

  protected slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  protected getRandomUserAgent(): string {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }

  abstract scrape(): Promise<number>;
}
