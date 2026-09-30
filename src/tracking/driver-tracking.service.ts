import { DriverService } from '../driverfleet/driver.service';
import { TravelledDistanceService } from '../driverfleet/driverreport/travelled-distance/travelled-distance.service';
import { EntityManager } from '@mikro-orm/postgresql';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';

import { DriverPositionRepository } from './driver-position.repository';
import { DriverPosition } from './driver-position.entity';

@Injectable()
export class DriverTrackingService {
  constructor(
    private readonly drivers: DriverService,
    @InjectRepository(DriverPosition)
    private positionRepository: DriverPositionRepository,
    private readonly distances: TravelledDistanceService,
    private readonly em: EntityManager,
  ) {}

  @Transactional()
  public async registerPosition(
    driverId: string,
    latitude: number,
    longitude: number,
    seenAt: number,
  ): Promise<DriverPosition> {
    await this.drivers.ensureActive(driverId);
    const position = new DriverPosition();
    position.setDriverId(driverId);
    position.setSeenAt(seenAt);
    position.setLatitude(latitude);
    position.setLongitude(longitude);
    await this.positionRepository.getEntityManager().persist(position).flush();
    await this.distances.addPosition(driverId, {
      id: position.id,
      latitude,
      longitude,
      seenAt,
    });
    return position;
  }

  public async calculateTravelledDistance(
    driverId: string,
    from: number,
    to: number,
  ) {
    await this.drivers.ensureExists(driverId);
    return this.distances.calculateDistance(driverId, from, to);
  }
}
