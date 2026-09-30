import {
  Entity,
  PrimaryKey,
  Embedded,
  Property,
  Enum,
} from '@mikro-orm/decorators/legacy';
import { ForbiddenException } from '@nestjs/common';
import { Tariff } from '../pricing/tariff';
import { Distance } from '../geolocation/distance';
export { Status } from './details/status';
export enum TransitStatus {
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
}

@Entity()
export class Transit {
  @PrimaryKey({ type: 'uuid' }) public requestId: string;
  @Embedded(() => Tariff) private tariff: Tariff;
  @Enum(() => TransitStatus) private status = TransitStatus.IN_TRANSIT;
  @Property({ type: 'double' }) private kilometers = 0;
  constructor(requestId: string, tariff: Tariff) {
    this.requestId = requestId;
    this.tariff = tariff;
  }
  public changeDestination(distance: Distance) {
    this.requireInProgress();
    this.kilometers = distance.toKm();
  }
  public complete(distance: Distance) {
    this.requireInProgress();
    this.kilometers = distance.toKm();
    this.status = TransitStatus.COMPLETED;
    return this.calculateFinalCosts();
  }
  public calculateFinalCosts() {
    if (this.status !== TransitStatus.COMPLETED)
      throw new ForbiddenException('Transit is not completed');
    return this.tariff.calculateCost(this.getDistance());
  }
  public getDistance() {
    return Distance.ofKm(this.kilometers);
  }
  public getStatus() {
    return this.status;
  }
  private requireInProgress() {
    if (this.status !== TransitStatus.IN_TRANSIT)
      throw new ForbiddenException('Transit is already completed');
  }
}
