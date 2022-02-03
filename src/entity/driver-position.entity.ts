import { BaseEntity } from '../common/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Driver } from './driver.entity';

@Entity()
export class DriverPosition extends BaseEntity {
  @ManyToOne(() => Driver)
  private driver: Driver;

  @Column()
  private latitude: number;

  @Column()
  private longitude: number;

  @Column({ type: 'bigint' })
  private seenAt: number;

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
