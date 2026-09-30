import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { DriverPosition } from '../entity/driver-position.entity';
import { DriverPositionRepository } from '../repository/driver-position.repository';
import { DriverSession } from '../entity/driver-session.entity';
import { DriverSessionRepository } from '../repository/driver-session.repository';
import { DriverStatus } from '../entity/driver.entity';
import { Status, Transit } from '../entity/transit.entity';
import { CarTypeService } from './car-type.service';
import { GeocodingService } from './geocoding.service';
import { DriverNotificationService } from './driver-notification.service';

const EARTH_RADIUS_KM = 6371;
const MAX_SEARCH_RADIUS_KM = 20;
const ASSIGNMENT_TIMEOUT_MS = 5 * 60 * 1000;

@Injectable()
export class DriverFinder {
  constructor(
    @InjectRepository(DriverPosition)
    private readonly positions: DriverPositionRepository,
    @InjectRepository(DriverSession)
    private readonly sessions: DriverSessionRepository,
    private readonly cars: CarTypeService,
    private readonly geocoding: GeocodingService,
    private readonly notifications: DriverNotificationService,
  ) {}

  public async findFor(transit: Transit): Promise<Transit> {
    if (transit.getStatus() !== Status.WAITING_FOR_DRIVER_ASSIGNMENT) {
      throw new NotAcceptableException('Transit is not awaiting assignment');
    }
    if ((transit.getPublished() ?? 0) + ASSIGNMENT_TIMEOUT_MS < Date.now()) {
      transit.failDriverAssignment();
      return transit;
    }
    const activeClasses = await this.cars.findActiveCarClasses();
    if (!activeClasses.includes(transit.getCarType())) return transit;
    const [latitude, longitude] = this.geocoding.geocodeAddress(
      transit.getFrom(),
    );
    for (let radius = 1; radius < MAX_SEARCH_RADIUS_KM; radius++) {
      const latitudeOffset = (radius / EARTH_RADIUS_KM) * (180 / Math.PI);
      const longitudeOffset =
        latitudeOffset / Math.cos((latitude * Math.PI) / 180);
      const candidates = await this.positions.findAverageDriverPositionSince(
        latitude - latitudeOffset,
        latitude + latitudeOffset,
        longitude - longitudeOffset,
        longitude + longitudeOffset,
        Date.now() - ASSIGNMENT_TIMEOUT_MS,
      );
      candidates.sort(
        (first, second) =>
          Math.hypot(
            latitude - first.getLatitude(),
            longitude - first.getLongitude(),
          ) -
          Math.hypot(
            latitude - second.getLatitude(),
            longitude - second.getLongitude(),
          ),
      );
      const sessions =
        await this.sessions.findAllByLoggedOutAtNullAndDriverInAndCarClassIn(
          candidates.slice(0, 20).map((position) => position.getDriver()),
          [transit.getCarType()],
        );
      for (const session of sessions) {
        const driver = session.getDriver();
        if (
          driver.getStatus() === DriverStatus.ACTIVE &&
          !driver.getOccupied() &&
          transit.canProposeTo(driver)
        ) {
          transit.proposeTo(driver);
          this.notifications.notifyAboutPossibleTransit(driver.id, transit.id);
        }
      }
      if (transit.getAwaitingDriversResponses() > 0) return transit;
    }
    transit.failDriverAssignment();
    return transit;
  }
}
