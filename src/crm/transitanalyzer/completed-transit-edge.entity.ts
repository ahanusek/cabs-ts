import {
  Entity,
  PrimaryKey,
  Property,
  Index,
} from '@mikro-orm/decorators/legacy';
import type { TransitCompleted } from './transit-completed';

@Entity()
@Index({ properties: ['clientId', 'fromHash', 'started'] })
export class CompletedTransitEdge {
  @PrimaryKey({ type: 'uuid' })
  public readonly transitId: string;
  @Property({ type: 'uuid' })
  public readonly clientId: string;
  @Property()
  public readonly fromHash: string;
  @Property()
  public readonly toHash: string;
  @Property({ type: 'bigint', runtimeType: 'number' })
  public readonly started: number;
  @Property({ type: 'bigint', runtimeType: 'number' })
  public readonly completeAt: number;

  constructor(event: TransitCompleted) {
    if (
      !Number.isFinite(event.started) ||
      !Number.isFinite(event.completeAt) ||
      event.completeAt < event.started
    ) {
      throw new RangeError('Invalid completed transit interval');
    }
    this.transitId = event.transitId;
    this.clientId = event.clientId;
    this.fromHash = event.fromHash;
    this.toHash = event.toHash;
    this.started = event.started;
    this.completeAt = event.completeAt;
  }
}
