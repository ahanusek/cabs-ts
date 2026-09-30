import { Claim, ClaimStatus } from '../entity/claim.entity';
import { Type } from '../entity/client.entity';
import { Money } from '../money/money';

export enum WhoToAsk {
  DRIVER = 'driver',
  CLIENT = 'client',
  NO_ONE = 'no_one',
}

export interface RefundRules {
  vipThreshold: Money;
  minimumTransits: number;
}

export interface ClaimDecision {
  whoToAsk: WhoToAsk;
  status: ClaimStatus;
}

export class ClaimsResolver {
  constructor(
    public readonly clientId: string,
    private claimedTransitIds: string[] = [],
  ) {}

  public resolve(
    claim: Claim,
    numberOfTransits: number,
    rules: RefundRules,
  ): ClaimDecision {
    const transitId = claim.getTransit().id;
    if (this.claimedTransitIds.includes(transitId))
      return this.escalate(WhoToAsk.NO_ONE);
    this.claimedTransitIds = [...this.claimedTransitIds, transitId];
    if (this.claimedTransitIds.length <= 3) return this.refund();
    const inexpensive =
      (claim.getTransit().getPrice() ?? Money.ZERO).toInt() <
      rules.vipThreshold.toInt();
    if (claim.getOwner().getType() === Type.VIP) {
      return inexpensive ? this.refund() : this.escalate(WhoToAsk.DRIVER);
    }
    if (numberOfTransits >= rules.minimumTransits) {
      return inexpensive ? this.refund() : this.escalate(WhoToAsk.CLIENT);
    }
    return this.escalate(WhoToAsk.DRIVER);
  }

  private refund(): ClaimDecision {
    return { whoToAsk: WhoToAsk.NO_ONE, status: ClaimStatus.REFUNDED };
  }

  private escalate(whoToAsk: WhoToAsk): ClaimDecision {
    return { whoToAsk, status: ClaimStatus.ESCALATED };
  }
}
