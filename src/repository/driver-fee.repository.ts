import { EntityRepository } from '@mikro-orm/postgresql';
import { DriverFee } from '../entity/driver-fee.entity';
import { Driver } from '../entity/driver.entity';

export class DriverFeeRepository extends EntityRepository<DriverFee> {
  public async findByDriver(driver: Driver): Promise<DriverFee | null> {
    return this.findOne({ driver });
  }
}
