import type { MilesSnapshot } from './miles-json';

export interface Miles {
  getAmountFor(moment: number): number;
  subtract(amount: number, moment: number): Miles;
  expiresAt(): number;
  snapshot(): MilesSnapshot;
}

export function requireMilesAmount(amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new RangeError('Miles must be a non-negative integer');
  }
}
