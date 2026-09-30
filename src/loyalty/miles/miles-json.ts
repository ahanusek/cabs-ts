import { ConstantUntil } from './constant-until';
import { TwoStepExpiringMiles } from './two-step-expiring-miles';
import { Miles } from './miles';

export type MilesSnapshot =
  | {
      kind: 'constant';
      amount: number;
      expiration: number | null;
    }
  | {
      kind: 'two-step';
      amount: number;
      firstExpiration: number;
      expiration: number | null;
    };

export function restoreMiles(snapshot: MilesSnapshot): Miles {
  if (snapshot.kind === 'two-step') {
    return new TwoStepExpiringMiles(
      snapshot.amount,
      snapshot.firstExpiration,
      snapshot.expiration ?? Infinity,
    );
  }
  return new ConstantUntil(snapshot.amount, snapshot.expiration ?? Infinity);
}
