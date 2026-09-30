import { TransitDetailsFacade } from '../transitdetails/transit-details.facade';
import { DriverLicense } from '../driverfleet/driver-license';
import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Driver, DriverStatus, DriverType } from '../entity/driver.entity';
import { DriverDto } from '../dto/driver.dto';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { DriverRepository } from '../repository/driver.repository';
import { InjectRepository } from '@mikro-orm/nestjs';
import { DriverAttributeRepository } from '../repository/driver-attribute.repository';

import dayjs from 'dayjs';
import { DriverAttribute } from '../entity/driver-attribute.entity';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: DriverRepository,
    @InjectRepository(DriverAttribute)
    private driverAttributeRepository: DriverAttributeRepository,
    private readonly details: TransitDetailsFacade,
  ) {}

  public async createDriver({
    photo,
    driverLicense,
    lastName,
    firstName,
  }: CreateDriverDto): Promise<Driver> {
    const driver = new Driver();
    driver.setDriverLicense(DriverLicense.withoutValidation(driverLicense));
    driver.setLastName(lastName);
    driver.setFirstName(firstName);
    driver.setStatus(DriverStatus.INACTIVE);
    driver.setType(DriverType.CANDIDATE);
    if (photo !== null) {
      if (Buffer.from(photo, 'base64').toString('base64') === photo) {
        driver.setPhoto(photo);
      } else {
        throw new NotAcceptableException('Illegal photo in base64');
      }
    }

    await this.driverRepository.getEntityManager().persist(driver).flush();
    return driver;
  }

  public async loadDriver(driverId: string): Promise<DriverDto> {
    const driver = await this.driverRepository.findOne({ id: driverId });

    if (!driver) {
      throw new NotFoundException(
        `Driver with id ${driverId} does not exists.`,
      );
    }

    return new DriverDto(driver);
  }

  public async changeDriverStatus(driverId: string, status: DriverStatus) {
    const driver = await this.driverRepository.findOne({ id: driverId });

    if (!driver) {
      throw new NotFoundException(
        `Driver with id ${driverId} does not exists.`,
      );
    }
    if (status === DriverStatus.ACTIVE) {
      try {
        driver.setDriverLicense(
          DriverLicense.withLicense(driver.getDriverLicense().asString()),
        );
      } catch {
        throw new ForbiddenException('An active driver needs a valid license');
      }
    }

    driver.setStatus(status);
    await this.driverRepository.getEntityManager().flush();
  }

  public async changeLicenseNumber(newLicense: string, driverId: string) {
    const driver = await this.driverRepository.findOne({ id: driverId });

    if (!driver) {
      throw new NotFoundException(
        `Driver with id ${driverId} does not exists.`,
      );
    }
    if (driver.getStatus() !== DriverStatus.ACTIVE) {
      throw new NotAcceptableException(
        'Driver is not active, cannot change license',
      );
    }
    try {
      driver.setDriverLicense(DriverLicense.withLicense(newLicense));
    } catch {
      throw new NotAcceptableException(
        'Illegal new license no = ' + newLicense,
      );
    }
    await this.driverRepository.getEntityManager().flush();
  }

  public async changePhoto(driverId: string, photo: string) {
    const driver = await this.driverRepository.findOne({ id: driverId });

    if (!driver) {
      throw new NotFoundException(
        `Driver with id ${driverId} does not exists.`,
      );
    }

    if (!photo || Buffer.from(photo, 'base64').toString('base64') === photo) {
      throw new NotAcceptableException('Illegal photo in base64');
    }
    driver.setPhoto(photo);
    await this.driverRepository.getEntityManager().flush();
  }

  public async calculateDriverMonthlyPayment(
    driverId: string,
    year: number,
    month: number,
  ) {
    const driver = await this.driverRepository.findOne({ id: driverId });

    if (!driver) {
      throw new NotFoundException(
        `Driver with id ${driverId} does not exists.`,
      );
    }

    const yearMonth = dayjs(`${year}-${month}`, 'YYYY-M');
    const from = yearMonth.startOf('month');
    const to = yearMonth.endOf('month');

    return this.details.driverEarnings(driverId, from.valueOf(), to.valueOf());
  }

  public async calculateDriverYearlyPayment(
    driverId: string,
    year: number,
  ): Promise<Map<number, number>> {
    const payments = new Map();
    const months = Array.from({ length: 12 }, (_, index) => index + 1);
    for (const m of months) {
      payments.set(
        m,
        await this.calculateDriverMonthlyPayment(driverId, year, m),
      );
    }
    return payments;
  }
}
