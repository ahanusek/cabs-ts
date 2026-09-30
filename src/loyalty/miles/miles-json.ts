import { ConstantUntil } from './constant-until';
import { Miles } from './miles';

export interface MilesSnapshot {
  kind: 'constant';
  amount: number;
  expiration: number | null;
}

export function restoreMiles(snapshot: MilesSnapshot): Miles {
  return new ConstantUntil(snapshot.amount, snapshot.expiration ?? Infinity);
}
