import { BaseEntity } from '../common/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Driver } from './driver.entity';

/* eslint-disable @typescript-eslint/explicit-member-accessibility */

@Entity()
export class DriverPosition extends BaseEntity {
  @ManyToOne(() => Driver)
  driver: Driver;

  @Column()
  latitude: number;

  @Column()
  longitude: number;

  @Column({ type: 'bigint' })
  seenAt: number;

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
