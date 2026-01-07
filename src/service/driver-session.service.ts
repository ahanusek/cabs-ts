import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { DriverRepository } from '../repository/driver.repository';
import { DriverSessionRepository } from '../repository/driver-session.repository';
import { CarTypeService } from './car-type.service';
import { CarClass } from '../entity/car-type.entity';
import { DriverSession } from '../entity/driver-session.entity';
import { Driver } from '../entity/driver.entity';

@Injectable()
export class DriverSessionService {
  constructor(
    @InjectRepository(DriverSession)
    private driverSessionRepository: DriverSessionRepository,
    @InjectRepository(Driver)
    private driverRepository: DriverRepository,
    private carTypeService: CarTypeService,
  ) {}

  public async logIn(
    driverId: string,
    plateNumber: string,
    carClass: CarClass,
    carBrand: string,
  ) {
    const session = new DriverSession();
    const driver = await this.driverRepository.findOne({ id: driverId });

    if (!driver) {
      throw new NotFoundException(`Driver with id ${driverId} not exists`);
    }
    session.setDriver(driver);
    session.setLoggedAt(Date.now());
    session.setCarClass(carClass);
    session.setPlatesNumber(plateNumber);
    session.setCarBrand(carBrand);
    await this.carTypeService.registerActiveCar(session.getCarClass());
    await this.driverSessionRepository.getEntityManager().persistAndFlush(session);
    return session;
  }

  public async logOut(sessionId: string) {
    const session = await this.driverSessionRepository.findOne({ id: sessionId });
    if (!session) {
      throw new NotFoundException('Session does not exist');
    }
    await this.carTypeService.unregisterCar(session.getCarClass());
    session.setLoggedOutAt(Date.now());

    await this.driverSessionRepository.getEntityManager().flush();
  }

  public async logOutCurrentSession(driverId: string) {
    const driver = await this.driverRepository.findOne({ id: driverId });

    if (!driver) {
      throw new NotFoundException(`Driver with id ${driverId} not exists`);
    }

    const session =
      await this.driverSessionRepository.findTopByDriverAndLoggedOutAtIsNullOrderByLoggedAtDesc(
        driver,
      );
    if (session) {
      session.setLoggedOutAt(Date.now());
      await this.carTypeService.unregisterCar(session.getCarClass());
      await this.driverSessionRepository.getEntityManager().flush();
    }
  }

  public async findByDriver(driverId: string): Promise<DriverSession[]> {
    const driver = await this.driverRepository.findOne({ id: driverId });

    if (!driver) {
      throw new NotFoundException(`Driver with id ${driverId} not exists`);
    }

    return this.driverSessionRepository.findByDriver(driver);
  }
}
