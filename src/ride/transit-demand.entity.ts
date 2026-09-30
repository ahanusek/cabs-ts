import {
  Entity,
  PrimaryKey,
  Property,
  Enum,
} from '@mikro-orm/decorators/legacy';
import { ForbiddenException } from '@nestjs/common';

export enum DemandStatus {
  WAITING = 'waiting',
  ACCEPTED = 'accepted',
  CANCELLED = 'cancelled',
}
const MAX_PICKUP_CHANGES = 3;
const MAX_PICKUP_DISTANCE_KM = 0.25;

@Entity()
export class TransitDemand {
  @PrimaryKey({ type: 'uuid' }) public requestId: string;
  @Enum(() => DemandStatus) private status = DemandStatus.WAITING;
  @Property() private pickupChanges = 0;
  constructor(requestId: string) {
    this.requestId = requestId;
  }
  public changePickup(distance: number) {
    this.requireWaiting();
    if (
      !Number.isFinite(distance) ||
      distance < 0 ||
      distance > MAX_PICKUP_DISTANCE_KM ||
      this.pickupChanges >= MAX_PICKUP_CHANGES
    )
      throw new ForbiddenException('Pickup address cannot be changed');
    this.pickupChanges++;
  }
  public accept() {
    this.requireWaiting();
    this.status = DemandStatus.ACCEPTED;
  }
  public cancel() {
    this.requireWaiting();
    this.status = DemandStatus.CANCELLED;
  }
  public getStatus() {
    return this.status;
  }
  private requireWaiting() {
    if (this.status !== DemandStatus.WAITING)
      throw new ForbiddenException('Demand is no longer waiting');
  }
}
