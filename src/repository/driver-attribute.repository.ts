import { EntityRepository } from '@mikro-orm/postgresql';
import { DriverAttribute } from '../entity/driver-attribute.entity';

export class DriverAttributeRepository extends EntityRepository<DriverAttribute> {}
