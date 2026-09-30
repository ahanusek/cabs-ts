import { Injectable, ForbiddenException } from '@nestjs/common';
import { TrackingQueries } from '../tracking/tracking-queries';
import { DriverService } from '../driverfleet/driver.service';
import { CarTypeService } from '../carfleet/car-type.service';
import { CarClass } from '../carfleet/car-type.entity';
import { GeocodingService } from '../geolocation/geocoding.service';
import { Address } from '../geolocation/address/address.entity';
import { DriverNotificationService } from '../notification/driver-notification.service';
import { DriverAssignment, AssignmentStatus } from './driver-assignment.entity';

const EARTH_RADIUS_KM = 6371;
const MAX_SEARCH_RADIUS_KM = 20;
const RECENT_POSITION_MS = 5 * 60 * 1000;

@Injectable()
export class DriverFinder {
  constructor(
    private readonly tracking: TrackingQueries,
    private readonly drivers: DriverService,
    private readonly cars: CarTypeService,
    private readonly geocoding: GeocodingService,
    private readonly notifications: DriverNotificationService,
  ) {}
  public async findFor(
    assignment: DriverAssignment,
    from: Address,
    carClass: CarClass,
  ) {
    if (assignment.getStatus() !== AssignmentStatus.WAITING)
      throw new ForbiddenException('Assignment is not waiting');
    if (assignment.isExpired(Date.now())) {
      assignment.fail();
      return;
    }
    if (!(await this.cars.findActiveCarClasses()).includes(carClass)) return;
    const [latitude, longitude] = this.geocoding.geocodeAddress(from);
    for (let radius = 1; radius <= MAX_SEARCH_RADIUS_KM; radius++) {
      const latitudeOffset = ((radius / EARTH_RADIUS_KM) * 180) / Math.PI;
      const longitudeOffset =
        latitudeOffset / Math.cos((latitude * Math.PI) / 180);
      const candidates = await this.tracking.nearby(
        {
          latitudeMin: latitude - latitudeOffset,
          latitudeMax: latitude + latitudeOffset,
          longitudeMin: longitude - longitudeOffset,
          longitudeMax: longitude + longitudeOffset,
        },
        Date.now() - RECENT_POSITION_MS,
      );
      candidates.sort(
        (a, b) =>
          Math.hypot(latitude - a.getLatitude(), longitude - a.getLongitude()) -
          Math.hypot(latitude - b.getLatitude(), longitude - b.getLongitude()),
      );
      const activeIds = await this.tracking.activeDrivers(
        candidates.slice(0, 20).map((position) => position.getDriverId()),
        carClass,
      );
      for (const driver of await this.drivers.findAvailable(activeIds)) {
        if (
          assignment.canProposeTo(driver.id) &&
          !assignment.getProposedDrivers().includes(driver.id)
        ) {
          assignment.proposeTo(driver.id);
          this.notifications.notifyAboutPossibleTransit(
            driver.id,
            assignment.requestId,
          );
        }
      }
      if (assignment.getAwaitingResponses() > 0) return;
    }
    assignment.fail();
  }
}
