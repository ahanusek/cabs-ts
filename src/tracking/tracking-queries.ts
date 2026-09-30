import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { DriverPosition } from './driver-position.entity';
import { DriverPositionRepository } from './driver-position.repository';
import { DriverSession } from './driver-session.entity';
import { DriverSessionRepository } from './driver-session.repository';
import { CarClass } from '../carfleet/car-type.entity';

@Injectable()
export class TrackingQueries {
  constructor(
    @InjectRepository(DriverPosition)
    private readonly positions: DriverPositionRepository,
    @InjectRepository(DriverSession)
    private readonly sessions: DriverSessionRepository,
  ) {}
  public nearby(
    bounds: {
      latitudeMin: number;
      latitudeMax: number;
      longitudeMin: number;
      longitudeMax: number;
    },
    since: number,
  ) {
    return this.positions.findAverageDriverPositionSince(
      bounds.latitudeMin,
      bounds.latitudeMax,
      bounds.longitudeMin,
      bounds.longitudeMax,
      since,
    );
  }
  public async activeDrivers(driverIds: string[], carClass: CarClass) {
    const sessions =
      await this.sessions.findAllByLoggedOutAtNullAndDriverInAndCarClassIn(
        driverIds,
        [carClass],
      );
    return [...new Set(sessions.map((session) => session.getDriverId()))];
  }
}
