import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProxyRotator } from './proxy-rotator';

@Injectable()
export class StealthBrowser implements OnModuleDestroy {
  private readonly logger = new Logger(StealthBrowser.name);
  private browser: any = null;
  private readonly timeout: number;

  constructor(
    private readonly config: ConfigService,
    private readonly proxyRotator: ProxyRotator,
  ) {
    this.timeout = this.config.get<number>('SCRAPER_TIMEOUT_MS', 30000);
  }

  async onModuleDestroy() {
    await this.closeBrowser();
  }

  async fetchPage(url: string): Promise<string> {
    // Try Playwright first, fallback to simple fetch
    try {
      return await this.fetchWithPlaywright(url);
    } catch (error) {
      this.logger.debug(
        `Playwright failed for ${url}: ${error.message}. Falling back to fetch.`,
      );
      return this.fetchWithHttp(url);
    }
  }

  private async fetchWithPlaywright(url: string): Promise<string> {
    const pw = await this.getPlaywright();
    if (!pw) {
      throw new Error('Playwright not available');
    }

    const { chromium } = pw;

    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    };

    const proxyUrl = this.proxyRotator.getProxyUrl();
    if (proxyUrl) {
      launchOptions.proxy = { server: proxyUrl };
    }

    const browser = await chromium.launch(launchOptions);

    try {
      const context = await browser.newContext({
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
      });

      const page = await context.newPage();

      // Block unnecessary resources for speed
      await page.route(
        '**/*.{png,jpg,jpeg,gif,svg,css,font,woff,woff2}',
        (route: any) => route.abort(),
      );

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.timeout,
      });

      // Wait a bit for dynamic content
      await page.waitForTimeout(2000);

      const html = await page.content();
      await browser.close();
      return html;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  private async fetchWithHttp(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.timeout,
    );

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async getPlaywright() {
    try {
      return await import('playwright');
    } catch {
      this.logger.warn(
        'Playwright not installed. Using HTTP fetch only.',
      );
      return null;
    }
  }

  private async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private getRandomUserAgent(): string {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }
}
