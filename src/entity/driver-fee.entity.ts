import { BaseEntity } from '../common/base.entity';
import { Driver } from './driver.entity';
import { Entity, Property, OneToOne, Enum } from '@mikro-orm/core';
import { DriverFeeRepository } from '../repository/driver-fee.repository';

export enum FeeType {
  FLAT = 'flat',
  PERCENTAGE = 'percentage',
}

@Entity({ repository: () => DriverFeeRepository })
export class DriverFee extends BaseEntity {
  @Enum(() => FeeType)
  private feeType!: FeeType;

  @Property()
  private amount!: number;

  @Property({ default: 0 })
  private min: number = 0;

  @OneToOne(() => Driver, (driver) => driver.fee)
  public driver!: Driver;

  constructor(
    feeType?: FeeType,
    driver?: Driver,
    amount?: number,
    min?: number,
  ) {
    super();
    if (feeType) this.feeType = feeType;
    if (driver) this.driver = driver;
    if (amount) this.amount = amount;
    if (min) this.min = min;
  }

  public getFeeType() {
    return this.feeType;
  }

  public setFeeType(feeType: FeeType) {
    this.feeType = feeType;
  }

  public getDriver() {
    return this.driver;
  }

  public setDriver(driver: Driver) {
    this.driver = driver;
  }

  public getAmount() {
    return this.amount;
  }

  public setAmount(amount: number) {
    this.amount = amount;
  }

  public getMin() {
    return this.min;
  }

  public setMin(min: number) {
    this.min = min;
  }
}
