import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Claim, ClaimStatus } from './claim.entity';

import { Money } from '../../money/money';

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

@Entity()
export class ClaimsResolver {
  @PrimaryKey({ type: 'uuid' })
  public readonly clientId: string;

  @Property({ type: 'json' })
  private claimedTransitIds: string[];

  constructor(clientId: string, claimedTransitIds: string[] = []) {
    this.clientId = clientId;
    this.claimedTransitIds = claimedTransitIds;
  }

  public resolve(
    claim: Claim,
    facts: { numberOfTransits: number; price: Money },
    rules: RefundRules,
  ): ClaimDecision {
    const transitId = claim.transitId;
    if (this.claimedTransitIds.includes(transitId))
      return this.escalate(WhoToAsk.NO_ONE);
    this.claimedTransitIds = [...this.claimedTransitIds, transitId];
    if (this.claimedTransitIds.length <= 3) return this.refund();
    const inexpensive = facts.price.toInt() < rules.vipThreshold.toInt();
    if (claim.clientType === 'vip') {
      return inexpensive ? this.refund() : this.escalate(WhoToAsk.DRIVER);
    }
    if (facts.numberOfTransits >= rules.minimumTransits) {
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
