import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { DriverStatus, DriverType } from '../models/driver.model';

@Entity()
export class Driver extends BaseEntity {
  @Column()
  private status: DriverStatus;

  @Column()
  private firstName: string;

  @Column()
  private lastName: string;

  @Column()
  private driverLicense: string;

  @Column()
  private photo: string;

  @Column()
  private type: DriverType;

  @Column({ default: false })
  private isOccupied: boolean;

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
}
