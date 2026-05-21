import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

@Injectable()
export class ProxyRotator {
  private readonly logger = new Logger(ProxyRotator.name);
  private proxies: ProxyConfig[] = [];
  private currentIndex = 0;
  private failedProxies = new Map<string, number>();

  constructor(private readonly config: ConfigService) {
    this.loadProxies();
  }

  private loadProxies() {
    const proxyList = this.config.get<string>('PROXY_LIST', '');
    if (!proxyList) {
      this.logger.warn('No proxy list configured. Running without proxies.');
      return;
    }

    // Format: host:port:user:pass,host:port:user:pass
    this.proxies = proxyList.split(',').map((p) => {
      const [host, port, username, password] = p.trim().split(':');
      return { host, port: parseInt(port), username, password };
    });

    this.logger.log(`Loaded ${this.proxies.length} proxies`);
  }

  getNext(): ProxyConfig | null {
    if (this.proxies.length === 0) return null;

    // Skip proxies that have failed too many times recently
    let attempts = 0;
    while (attempts < this.proxies.length) {
      const proxy = this.proxies[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length;

      const key = `${proxy.host}:${proxy.port}`;
      const failures = this.failedProxies.get(key) || 0;

      if (failures < 3) {
        return proxy;
      }
      attempts++;
    }

    // All proxies have too many failures, reset and try again
    this.failedProxies.clear();
    return this.proxies[0] || null;
  }

  getProxyUrl(): string | null {
    const proxy = this.getNext();
    if (!proxy) return null;

    if (proxy.username && proxy.password) {
      return `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    }
    return `http://${proxy.host}:${proxy.port}`;
  }

  reportFailure(proxyUrl: string) {
    const match = proxyUrl.match(/@?([^:]+):(\d+)$/);
    if (match) {
      const key = `${match[1]}:${match[2]}`;
      const count = (this.failedProxies.get(key) || 0) + 1;
      this.failedProxies.set(key, count);
      this.logger.warn(`Proxy ${key} failure count: ${count}`);
    }
  }

  reportSuccess(proxyUrl: string) {
    const match = proxyUrl.match(/@?([^:]+):(\d+)$/);
    if (match) {
      const key = `${match[1]}:${match[2]}`;
      this.failedProxies.delete(key);
    }
  }

  get availableCount(): number {
    return this.proxies.length;
  }
}
