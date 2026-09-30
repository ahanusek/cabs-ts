import { DriverService } from '../driverfleet/driver.service';
import { EntityManager } from '@mikro-orm/postgresql';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';

import { DriverSessionRepository } from './driver-session.repository';
import { CarTypeService } from '../carfleet/car-type.service';
import { CarClass } from '../carfleet/car-type.entity';
import { DriverSession } from './driver-session.entity';

@Injectable()
export class DriverSessionService {
  constructor(
    @InjectRepository(DriverSession)
    private driverSessionRepository: DriverSessionRepository,
    private readonly drivers: DriverService,
    private readonly em: EntityManager,
    private carTypeService: CarTypeService,
  ) {}

  @Transactional()
  public async logIn(
    driverId: string,
    plateNumber: string,
    carClass: CarClass,
    carBrand: string,
  ) {
    const session = new DriverSession();
    await this.drivers.ensureExists(driverId);
    session.setDriverId(driverId);
    session.setLoggedAt(Date.now());
    session.setCarClass(carClass);
    session.setPlatesNumber(plateNumber);
    session.setCarBrand(carBrand);
    await this.carTypeService.registerActiveCar(session.getCarClass());
    await this.driverSessionRepository
      .getEntityManager()
      .persist(session)
      .flush();
    return session;
  }

  @Transactional()
  public async logOut(sessionId: string) {
    const session = await this.driverSessionRepository.findOne({
      id: sessionId,
    });
    if (!session) {
      throw new NotFoundException('Session does not exist');
    }
    if (session.getLoggedOutAt() !== null) return;
    await this.carTypeService.unregisterActiveCar(session.getCarClass());
    session.setLoggedOutAt(Date.now());

    await this.driverSessionRepository.getEntityManager().flush();
  }

  @Transactional()
  public async logOutCurrentSession(driverId: string) {
    await this.drivers.ensureExists(driverId);

    const session =
      await this.driverSessionRepository.findTopByDriverAndLoggedOutAtIsNullOrderByLoggedAtDesc(
        driverId,
      );
    if (session) {
      session.setLoggedOutAt(Date.now());
      await this.carTypeService.unregisterActiveCar(session.getCarClass());
      await this.driverSessionRepository.getEntityManager().flush();
    }
  }

  public async findByDriver(driverId: string): Promise<DriverSession[]> {
    await this.drivers.ensureExists(driverId);

    return this.driverSessionRepository.findByDriver(driverId);
  }
}
