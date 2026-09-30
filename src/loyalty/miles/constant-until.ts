import type { MilesSnapshot } from './miles-json';
import { Miles, requireMilesAmount } from './miles';

export class ConstantUntil implements Miles {
  constructor(
    private readonly amount: number,
    private readonly expiration: number,
  ) {
    requireMilesAmount(amount);
    if (Number.isNaN(expiration)) throw new RangeError('Invalid expiration');
  }

  public static forever(amount: number): ConstantUntil {
    return new ConstantUntil(amount, Number.POSITIVE_INFINITY);
  }

  public getAmountFor(moment: number): number {
    return moment <= this.expiration ? this.amount : 0;
  }

  public subtract(amount: number, moment: number): ConstantUntil {
    requireMilesAmount(amount);
    if (amount > this.getAmountFor(moment)) {
      throw new RangeError('Insufficient miles');
    }
    return new ConstantUntil(this.amount - amount, this.expiration);
  }

  public snapshot(): MilesSnapshot {
    return {
      kind: 'constant',
      amount: this.amount,
      expiration: Number.isFinite(this.expiration) ? this.expiration : null,
    };
  }

  public expiresAt(): number {
    return this.expiration;
  }
}
