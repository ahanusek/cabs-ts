import { EntityRepository } from '@mikro-orm/postgresql';
import { DriverAttribute } from './driver-attribute.entity';

export class DriverAttributeRepository extends EntityRepository<DriverAttribute> {}
