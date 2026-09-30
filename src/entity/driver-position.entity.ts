import { BaseEntity } from '../common/base.entity';
import { Entity, Property, ManyToOne } from '@mikro-orm/decorators/legacy';
import { Driver } from '../driverfleet/driver.entity';
import { DriverPositionRepository } from '../repository/driver-position.repository';

@Entity({ repository: () => DriverPositionRepository })
export class DriverPosition extends BaseEntity {
  @ManyToOne(() => Driver)
  public driver!: Driver;

  @Property({ type: 'double' })
  public latitude!: number;

  @Property({ type: 'double' })
  public longitude!: number;

  @Property({ type: 'bigint', runtimeType: 'number' })
  public seenAt!: number;

  public getDriver() {
    return this.driver;
  }

  public setDriver(driver: Driver) {
    this.driver = driver;
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
