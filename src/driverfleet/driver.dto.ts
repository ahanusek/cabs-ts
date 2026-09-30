import { Driver, DriverStatus, DriverType } from './driver.entity';

export class DriverDto {
  public readonly id: string;

  public readonly status: DriverStatus;

  public readonly firstName: string;

  public readonly lastName: string;

  public readonly driverLicense: string;

  public readonly photo: string | null;

  public readonly type: DriverType;

  constructor(driver: Driver) {
    this.id = driver.getId();
    this.firstName = driver.getFirstName();
    this.lastName = driver.getLastName();
    this.driverLicense = driver.getDriverLicense().asString();
    this.photo = driver.getPhoto();
    this.status = driver.getStatus();
    this.type = driver.getType();
  }
}
