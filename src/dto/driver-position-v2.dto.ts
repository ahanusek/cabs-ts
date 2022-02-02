import { Driver } from '../entity/driver.entity';

export class DriverPositionV2Dto {
  private driver: Driver;

  private latitude: number;

  private longitude: number;

  private seenAt: number;

  constructor(
    driver: Driver,
    latitude: number,
    longitude: number,
    seenAt: number,
  ) {
    this.driver = driver;
    this.latitude = latitude;
    this.longitude = longitude;
    this.seenAt = seenAt;
  }
}
