import { BaseEntity } from '../common/base.entity';
import { Entity, Property } from '@mikro-orm/decorators/legacy';

import { DriverPositionRepository } from './driver-position.repository';

@Entity({ repository: () => DriverPositionRepository })
export class DriverPosition extends BaseEntity {
  @Property({ type: 'uuid' })
  public driverId!: string;

  @Property({ type: 'double' })
  public latitude!: number;

  @Property({ type: 'double' })
  public longitude!: number;

  @Property({ type: 'bigint', runtimeType: 'number' })
  public seenAt!: number;

  public getDriverId() {
    return this.driverId;
  }

  public setDriverId(driverId: string) {
    this.driverId = driverId;
  }

  public getLatitude() {
    return this.latitude;
  }

  public setLatitude(latitude: number) {
    this.latitude = latitude;
  }

  public getLongitude() {
    return this.longitude;
  }

  public setLongitude(longitude: number) {
    this.longitude = longitude;
  }

  public getSeenAt() {
    return this.seenAt;
  }

  public setSeenAt(seenAt: number) {
    this.seenAt = seenAt;
  }
}
