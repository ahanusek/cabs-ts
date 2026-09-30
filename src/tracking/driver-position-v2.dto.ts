export class DriverPositionV2Dto {
  private driverId: string;

  private latitude: number;

  private longitude: number;

  private seenAt: number;

  constructor(
    driverId: string,
    latitude: number,
    longitude: number,
    seenAt: number,
  ) {
    this.driverId = driverId;
    this.latitude = latitude;
    this.longitude = longitude;
    this.seenAt = seenAt;
  }

  public getDriverId() {
    return this.driverId;
  }

  public setDriverId(driverId: string) {
    this.driverId = driverId;
  }

  public getLatitude() {
    return this.latitude;
  }

  public setLatitude(latitude: number) {
    this.latitude = latitude;
  }

  public getLongitude() {
    return this.longitude;
  }

  public setLongitude(longitude: number) {
    this.longitude = longitude;
  }

  public getSeenAt() {
    return this.seenAt;
  }

  public setSeenAt(seenAt: number) {
    this.seenAt = seenAt;
  }
}
