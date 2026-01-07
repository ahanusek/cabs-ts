import { BaseEntity } from '../common/base.entity';
import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { Driver } from './driver.entity';
import { CarClass } from './car-type.entity';
import { DriverSessionRepository } from '../repository/driver-session.repository';

@Entity({ repository: () => DriverSessionRepository })
export class DriverSession extends BaseEntity {
  @Property({ nullable: true, type: 'bigint' })
  public loggedAt?: number;

  @Property({ nullable: true, type: 'bigint' })
  public loggedOutAt: number | null = null;

  @ManyToOne(() => Driver)
  public driver!: Driver;

  @Property()
  public platesNumber!: string;

  @Enum(() => CarClass)
  public carClass!: CarClass;

  @Property()
  public carBrand!: string;

  public getLoggedAt() {
    return this.loggedAt;
  }

  public getCarBrand() {
    return this.carBrand;
  }

  public setCarBrand(carBrand: string) {
    this.carBrand = carBrand;
  }

  public setLoggedAt(loggedAt: number) {
    this.loggedAt = loggedAt;
  }

  public getLoggedOutAt() {
    return this.loggedOutAt;
  }

  public setLoggedOutAt(loggedOutAt: number) {
    this.loggedOutAt = loggedOutAt;
  }

  public getDriver() {
    return this.driver;
  }

  public setDriver(driver: Driver) {
    this.driver = driver;
  }

  public getPlatesNumber() {
    return this.platesNumber;
  }

  public setPlatesNumber(platesNumber: string) {
    this.platesNumber = platesNumber;
  }

  public getCarClass() {
    return this.carClass;
  }

  public setCarClass(carClass: CarClass) {
    this.carClass = carClass;
  }
}
