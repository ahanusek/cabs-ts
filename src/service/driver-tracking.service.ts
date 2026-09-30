import { TravelledDistanceService } from '../driverreport/travelled-distance/travelled-distance.service';
import { EntityManager } from '@mikro-orm/postgresql';
import { Transactional } from '@mikro-orm/decorators/legacy';
import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { DriverRepository } from '../repository/driver.repository';
import { DriverPositionRepository } from '../repository/driver-position.repository';
import { DriverPosition } from '../entity/driver-position.entity';
import { Driver, DriverStatus } from '../entity/driver.entity';

@Injectable()
export class DriverTrackingService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: DriverRepository,
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
    const driver = await this.driverRepository.findOne({ id: driverId });
    if (!driver) {
      throw new NotFoundException('Driver does not exists, id = ' + driverId);
    }
    if (driver.getStatus() !== DriverStatus.ACTIVE) {
      throw new NotAcceptableException(
        'Driver is not active, cannot register position, id = ' + driverId,
      );
    }
    const position = new DriverPosition();
    position.setDriver(driver);
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
    const driver = await this.driverRepository.findOne({ id: driverId });
    if (!driver) {
      throw new NotFoundException('Driver does not exists, id = ' + driverId);
    }
    return this.distances.calculateDistance(driverId, from, to);
  }
}
