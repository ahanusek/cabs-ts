import { EntityRepository } from '@mikro-orm/postgresql';
import { Driver } from './driver.entity';

export class DriverRepository extends EntityRepository<Driver> {}
