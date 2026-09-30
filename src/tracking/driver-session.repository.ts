import { EntityRepository } from '@mikro-orm/postgresql';
import { DriverSession } from './driver-session.entity';
import { CarClass } from '../carfleet/car-type.entity';

import { NotFoundException } from '@nestjs/common';

export class DriverSessionRepository extends EntityRepository<DriverSession> {
  public async findAllByLoggedOutAtNullAndDriverInAndCarClassIn(
    driverIds: string[],
    carClasses: CarClass[],
  ): Promise<DriverSession[]> {
    return this.find({
      driverId: { $in: driverIds },
      carClass: { $in: carClasses },
      loggedOutAt: null,
    });
  }

  public async findTopByDriverAndLoggedOutAtIsNullOrderByLoggedAtDesc(
    driverId: string,
  ): Promise<DriverSession> {
    const session = await this.findOne(
      { driverId, loggedOutAt: null },
      { orderBy: { loggedAt: 'DESC' } },
    );

    if (!session) {
      throw new NotFoundException(`Session for ${driverId} not exists`);
    }
    return session;
  }

  public async findAllByDriverAndLoggedAtAfter(
    driverId: string,
    since: number,
  ): Promise<DriverSession[]> {
    return this.find({
      driverId,
      loggedAt: { $gt: since },
    });
  }

  public async findByDriver(driverId: string): Promise<DriverSession[]> {
    return this.find({ driverId });
  }
}
