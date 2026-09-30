import { AwardedMiles } from '../entity/awarded-miles.entity';
import { Type } from '../entity/client.entity';

export type MilesComparator = (
  first: AwardedMiles,
  second: AwardedMiles,
) => number;

export interface SpendingContext {
  transitCount: number;
  claimCount: number;
  clientType: Type;
  moment: number;
}

const oldestFirst: MilesComparator = (a, b) => a.getDate() - b.getDate();
const expirationFirst: MilesComparator = (a, b) => {
  const first = a.getExpirationDate();
  const second = b.getExpirationDate();
  return first === second ? 0 : first - second;
};
const nonExpiringLast: MilesComparator = (a, b) =>
  Number(a.cantExpire()) - Number(b.cantExpire());
const frequentClientThreshold = 15;
const frequentClaimantThreshold = 3;

export function chooseMilesSpendingPolicy(
  context: SpendingContext,
): MilesComparator {
  if (context.claimCount >= frequentClaimantThreshold) {
    return (a, b) => expirationFirst(b, a);
  }
  const frequentClient = context.transitCount >= frequentClientThreshold;
  const isSunday = new Date(context.moment).getDay() === 0;
  if (context.clientType === Type.VIP || (frequentClient && isSunday)) {
    return (a, b) => nonExpiringLast(a, b) || expirationFirst(a, b);
  }
  if (frequentClient) {
    return (a, b) => nonExpiringLast(a, b) || oldestFirst(a, b);
  }
  return oldestFirst;
}
