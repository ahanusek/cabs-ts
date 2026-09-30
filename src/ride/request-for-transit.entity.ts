import { Entity, Embedded, Property } from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../common/base.entity';
import { Tariff } from '../pricing/tariff';
import { Distance } from '../geolocation/distance';

@Entity()
export class RequestForTransit extends BaseEntity {
  @Embedded(() => Tariff)
  private tariff: Tariff;
  @Property({ type: 'double' })
  private kilometers: number;

  constructor(tariff: Tariff, distance: Distance) {
    super();
    this.tariff = tariff;
    this.kilometers = distance.toKm();
  }
  public getTariff() {
    return this.tariff;
  }
  public getDistance() {
    return Distance.ofKm(this.kilometers);
  }
  public getEstimatedPrice() {
    return this.tariff.calculateCost(this.getDistance());
  }
}
