import { BaseEntity } from '../common/base.entity';
import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { Driver } from './driver.entity';
import { DriverAttributeRepository } from '../repository/driver-attribute.repository';

export enum DriverAttributeName {
  PENALTY_POINTS = 'penalty_points',
  NATIONALITY = 'nationality',
  YEARS_OF_EXPERIENCE = 'years_of_experience',
  MEDICAL_EXAMINATION_EXPIRATION_DATE = 'medial_examination_expiration_date',
  MEDICAL_EXAMINATION_REMARKS = 'medical_examination_remarks',
  EMAIL = 'email',
  BIRTHPLACE = 'birthplace',
  COMPANY_NAME = 'companyName',
}

@Entity({ repository: () => DriverAttributeRepository })
export class DriverAttribute extends BaseEntity {
  @Enum(() => DriverAttributeName)
  private name!: DriverAttributeName;

  @Property()
  private value!: string;

  @ManyToOne(() => Driver)
  public driver!: Driver;

  constructor(driver?: Driver, attr?: DriverAttributeName, value?: string) {
    super();
    if (driver) this.driver = driver;
    if (attr) this.name = attr;
    if (value) this.value = value;
  }

  public getName() {
    return this.name;
  }

  public setName(name: DriverAttributeName) {
    this.name = name;
  }

  public getValue() {
    return this.value;
  }

  public setValue(value: string) {
    this.value = value;
  }

  public getDriver() {
    return this.driver;
  }

  public setDriver(driver: Driver) {
    this.driver = driver;
  }
}
