import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { Driver } from '../entity/driver.entity';
import { DriverDto } from '../dto/driver.dto';
import { DriverStatus, DriverType } from '../models/driver.model';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { DriverRepository } from '../repository/driver.repository';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(DriverRepository)
    private driverRepository: DriverRepository,
  ) {}

  public async createDriver({
    photo,
    driverLicense,
    lastName,
    firstName,
  }: CreateDriverDto): Promise<Driver> {
    const driver = this.driverRepository.create();

    driver.setDriverLicense(driverLicense);
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

    return this.driverRepository.save(driver);
  }

  public async loadDriver(driverId: string): Promise<DriverDto> {
    const driver = await this.driverRepository.findOne(driverId);

    if (!driver) {
      throw new NotFoundException(
        `Driver with id ${driverId} does not exists.`,
      );
    }

    return new DriverDto(driver);
  }
}
