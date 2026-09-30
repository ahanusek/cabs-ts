import { DriverLicense } from '../driverfleet/driver-license';
import { DriverLicenseType } from '../driverfleet/driver-license.type';
import { Collection } from '@mikro-orm/core';
import {
  Entity,
  Property,
  OneToMany,
  OneToOne,
  Enum,
} from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../common/base.entity';

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

  @Property({ type: DriverLicenseType })
  private driverLicense!: DriverLicense;

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

  public getAttributes() {
    return this.attributes.getItems();
  }

  public setAttributes(attributes: DriverAttribute[]) {
    this.attributes.set(attributes);
  }

  public setLastName(lastName: string) {
    this.lastName = lastName;
  }

  public setFirstName(firstName: string) {
    this.firstName = firstName;
  }

  public setDriverLicense(license: DriverLicense) {
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
}
