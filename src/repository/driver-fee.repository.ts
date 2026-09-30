import { EntityRepository } from '@mikro-orm/postgresql';
import { DriverFee } from '../entity/driver-fee.entity';

export class DriverFeeRepository extends EntityRepository<DriverFee> {
  public async findByDriverId(driverId: string): Promise<DriverFee | null> {
    return this.findOne({ driver: driverId });
  }
}
