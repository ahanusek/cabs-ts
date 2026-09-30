import { Money } from '../money/money';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { DriverFeeRepository } from './driver-fee.repository';

import { FeeType, DriverFee } from './driver-fee.entity';

@Injectable()
export class DriverFeeService {
  constructor(
    @InjectRepository(DriverFee)
    private driverFeeRepository: DriverFeeRepository,
  ) {}

  public async calculateDriverFee(driverId: string, transitPrice: Money) {
    const driverFee = await this.driverFeeRepository.findByDriverId(driverId);
    if (!driverFee) {
      throw new NotFoundException(
        'driver Fees not defined for driver, driver id = ' + driverId,
      );
    }
    let finalFee;
    if (driverFee.getFeeType() === FeeType.FLAT) {
      finalFee = transitPrice.subtract(Money.fromMajor(driverFee.getAmount()));
    } else {
      finalFee = transitPrice.percentage(driverFee.getAmount());
    }

    return finalFee.max(driverFee.getMin());
  }
}
