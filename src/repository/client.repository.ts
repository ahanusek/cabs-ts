import { EntityRepository } from '@mikro-orm/postgresql';
import { Client } from '../entity/client.entity';

export class ClientRepository extends EntityRepository<Client> {}
