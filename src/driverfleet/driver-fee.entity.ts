import { Money } from '../money/money';
import { MoneyType } from '../money/money.type';
import { BaseEntity } from '../common/base.entity';
import { Driver } from './driver.entity';
import { Entity, Property, OneToOne, Enum } from '@mikro-orm/decorators/legacy';
import { DriverFeeRepository } from './driver-fee.repository';

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

  @Property({ type: MoneyType, defaultRaw: '0' })
  private min: Money = Money.ZERO;

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
    if (min !== undefined) this.min = Money.fromMajor(min);
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

  public setMin(min: Money) {
    this.min = min;
  }
}
