import { BaseEntity } from '../common/base.entity';
import { Entity, Property, Enum } from '@mikro-orm/decorators/legacy';

import { CarClass } from '../carfleet/car-type.entity';
import { DriverSessionRepository } from './driver-session.repository';

@Entity({ repository: () => DriverSessionRepository })
export class DriverSession extends BaseEntity {
  @Property({ nullable: true, type: 'bigint', runtimeType: 'number' })
  public loggedAt?: number;

  @Property({ nullable: true, type: 'bigint', runtimeType: 'number' })
  public loggedOutAt: number | null = null;

  @Property({ type: 'uuid' })
  public driverId!: string;

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

  public getDriverId() {
    return this.driverId;
  }

  public setDriverId(driverId: string) {
    this.driverId = driverId;
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
