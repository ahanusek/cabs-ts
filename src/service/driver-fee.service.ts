import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DriverFeeRepository } from '../repository/driver-fee.repository';
import { TransitRepository } from '../repository/transit.repository';
import { FeeType } from '../entity/driver-fee.entity';

@Injectable()
export class DriverFeeService {
  constructor(
    @InjectRepository(DriverFeeRepository)
    private driverFeeRepository: DriverFeeRepository,
    @InjectRepository(TransitRepository)
    private transitRepository: TransitRepository,
  ) {}

  public async calculateDriverFee(transitId: string) {
    const transit = await this.transitRepository.findOne(transitId);
    if (!transit) {
      throw new NotFoundException('transit does not exist, id = ' + transitId);
    }
    if (transit.getDriversFee() != null) {
      return transit.getDriversFee();
    }
    const transitPrice = transit.getPrice() ?? 0;
    const driverFee = await this.driverFeeRepository.findByDriver(
      transit.getDriver(),
    );
    if (!driverFee) {
      throw new NotFoundException(
        'driver Fees not defined for driver, driver id = ' +
          transit.getDriver().getId(),
      );
    }
    let finalFee;
    if (driverFee.getFeeType() === FeeType.FLAT) {
      finalFee = transitPrice - driverFee.getAmount();
    } else {
      finalFee = (transitPrice * driverFee.getAmount()) / 100;
    }

    return Math.max(
      finalFee,
      driverFee.getMin() == null ? 0 : driverFee.getMin(),
    );
  }
}
