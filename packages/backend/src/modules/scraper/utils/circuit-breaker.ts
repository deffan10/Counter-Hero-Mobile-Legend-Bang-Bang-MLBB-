import { Injectable, Logger } from '@nestjs/common';

interface CircuitState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
  openedAt: number;
}

@Injectable()
export class CircuitBreaker {
  private readonly logger = new Logger(CircuitBreaker.name);
  private circuits = new Map<string, CircuitState>();

  // Open circuit after 5 consecutive failures
  private readonly failureThreshold = 5;
  // Reset after 5 minutes
  private readonly resetTimeoutMs = 5 * 60 * 1000;

  isAvailable(source: string): boolean {
    const circuit = this.circuits.get(source);
    if (!circuit) return true;

    if (circuit.state === 'closed') return true;

    if (circuit.state === 'open') {
      const elapsed = Date.now() - circuit.openedAt;
      if (elapsed > this.resetTimeoutMs) {
        circuit.state = 'half-open';
        this.logger.log(`Circuit half-open for: ${source}`);
        return true;
      }
      return false;
    }

    // half-open: allow one request through
    return true;
  }

  recordSuccess(source: string) {
    const circuit = this.circuits.get(source);
    if (!circuit) return;

    if (circuit.state === 'half-open') {
      this.logger.log(`Circuit closed for: ${source} (recovered)`);
    }

    circuit.failures = 0;
    circuit.state = 'closed';
  }

  recordFailure(source: string) {
    let circuit = this.circuits.get(source);
    if (!circuit) {
      circuit = { failures: 0, lastFailure: 0, state: 'closed', openedAt: 0 };
      this.circuits.set(source, circuit);
    }

    circuit.failures++;
    circuit.lastFailure = Date.now();

    if (circuit.failures >= this.failureThreshold) {
      circuit.state = 'open';
      circuit.openedAt = Date.now();
      this.logger.error(
        `Circuit OPEN for: ${source} (${circuit.failures} failures)`,
      );
    }
  }

  getStatus(): Record<string, { state: string; failures: number }> {
    const status: Record<string, { state: string; failures: number }> = {};
    for (const [source, circuit] of this.circuits) {
      status[source] = {
        state: circuit.state,
        failures: circuit.failures,
      };
    }
    return status;
  }

  reset(source: string) {
    this.circuits.delete(source);
    this.logger.log(`Circuit reset for: ${source}`);
  }
}
