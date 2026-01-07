import {
  Entity,
  Property,
  OneToMany,
  OneToOne,
  Collection,
  Enum,
} from '@mikro-orm/core';
import { BaseEntity } from '../common/base.entity';
import { Transit } from './transit.entity';
import { DriverAttribute } from './driver-attribute.entity';
import { DriverFee } from './driver-fee.entity';
import { DriverRepository } from '../repository/driver.repository';

export enum DriverStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
}

export enum DriverType {
  CANDIDATE = 'candidate',
  REGULAR = 'regular',
}

@Entity({ repository: () => DriverRepository })
export class Driver extends BaseEntity {
  @Enum(() => DriverStatus)
  private status!: DriverStatus;

  @Property()
  private firstName!: string;

  @Property()
  private lastName!: string;

  @Property()
  private driverLicense!: string;

  @Property({ nullable: true, type: 'varchar' })
  private photo: string | null = null;

  @Enum(() => DriverType)
  private type!: DriverType;

  @Property({ default: false })
  private isOccupied: boolean = false;

  @OneToOne(() => DriverFee, (fee) => fee.driver, {
    owner: true,
    nullable: true,
  })
  public fee?: DriverFee;

  @OneToMany(() => DriverAttribute, (driverAttribute) => driverAttribute.driver)
  public attributes = new Collection<DriverAttribute>(this);

  @OneToMany(() => Transit, (transit) => transit.driver)
  public transits = new Collection<Transit>(this);

  public getAttributes() {
    return this.attributes.getItems();
  }

  public setAttributes(attributes: DriverAttribute[]) {
    this.attributes.set(attributes);
  }

  public calculateEarningsForTransit(transit: Transit) {
    console.log(transit);
    return null;
  }

  public setLastName(lastName: string) {
    this.lastName = lastName;
  }

  public setFirstName(firstName: string) {
    this.firstName = firstName;
  }

  public setDriverLicense(license: string) {
    this.driverLicense = license;
  }

  public setStatus(status: DriverStatus) {
    this.status = status;
  }

  public setType(type: DriverType) {
    this.type = type;
  }

  public setPhoto(photo: string) {
    this.photo = photo;
  }

  public getLastName() {
    return this.lastName;
  }

  public getFirstName() {
    return this.firstName;
  }

  public getDriverLicense() {
    return this.driverLicense;
  }

  public getStatus() {
    return this.status;
  }

  public getType() {
    return this.type;
  }

  public getPhoto() {
    return this.photo;
  }

  public getFee() {
    return this.fee;
  }

  public setFee(fee: DriverFee) {
    this.fee = fee;
  }

  public getOccupied() {
    return this.isOccupied;
  }

  public setOccupied(isOccupied: boolean) {
    this.isOccupied = isOccupied;
  }

  public getTransits() {
    return this.transits.getItems();
  }
}
