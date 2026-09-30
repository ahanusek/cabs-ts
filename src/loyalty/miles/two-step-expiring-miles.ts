import { ConstantUntil } from './constant-until';
import { Miles, requireMilesAmount } from './miles';
import type { MilesSnapshot } from './miles-json';

export class TwoStepExpiringMiles implements Miles {
  constructor(
    private readonly amount: number,
    private readonly firstExpiration: number,
    private readonly finalExpiration: number,
  ) {
    requireMilesAmount(amount);
    if (
      !Number.isFinite(firstExpiration) ||
      finalExpiration < firstExpiration ||
      Number.isNaN(finalExpiration)
    ) {
      throw new RangeError('Expiration dates must be ordered');
    }
  }

  public getAmountFor(moment: number): number {
    if (moment <= this.firstExpiration) return this.amount;
    if (moment <= this.finalExpiration) return Math.ceil(this.amount / 2);
    return 0;
  }

  public subtract(amount: number, moment: number): Miles {
    requireMilesAmount(amount);
    const available = this.getAmountFor(moment);
    if (amount > available) throw new RangeError('Insufficient miles');
    const remaining = available - amount;
    if (moment <= this.firstExpiration) {
      return new TwoStepExpiringMiles(
        remaining,
        this.firstExpiration,
        this.finalExpiration,
      );
    }
    // The first expiration has already happened; do not halve the balance again.
    return new ConstantUntil(remaining, this.finalExpiration);
  }

  public expiresAt(): number {
    return this.finalExpiration;
  }

  public snapshot(): MilesSnapshot {
    return {
      kind: 'two-step',
      amount: this.amount,
      firstExpiration: this.firstExpiration,
      expiration: Number.isFinite(this.finalExpiration)
        ? this.finalExpiration
        : null,
    };
  }
}
