import { EntityRepository } from '@mikro-orm/postgresql';
import { DriverSession } from '../entity/driver-session.entity';
import { CarClass } from '../entity/car-type.entity';
import { Driver } from '../entity/driver.entity';
import { NotFoundException } from '@nestjs/common';

export class DriverSessionRepository extends EntityRepository<DriverSession> {
  public async findAllByLoggedOutAtNullAndDriverInAndCarClassIn(
    drivers: Driver[],
    carClasses: CarClass[],
  ): Promise<DriverSession[]> {
    console.log('To implement...', drivers, carClasses);
    return [];
  }

  public async findTopByDriverAndLoggedOutAtIsNullOrderByLoggedAtDesc(
    driver: Driver,
  ): Promise<DriverSession> {
    const session = await this.findOne(
      { driver, loggedOutAt: null },
      { orderBy: { loggedAt: 'DESC' } },
    );

    if (!session) {
      throw new NotFoundException(`Session for ${driver.getId()} not exists`);
    }
    return session;
  }

  public async findAllByDriverAndLoggedAtAfter(
    driver: Driver,
    since: number,
  ): Promise<DriverSession[]> {
    return this.find({
      driver,
      loggedAt: { $gt: since },
    });
  }

  public async findByDriver(driver: Driver): Promise<DriverSession[]> {
    return this.find({ driver });
  }
}
