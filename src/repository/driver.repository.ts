import { EntityRepository } from '@mikro-orm/postgresql';
import { Driver } from '../entity/driver.entity';

export class DriverRepository extends EntityRepository<Driver> {}
