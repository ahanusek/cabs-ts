import { EntityRepository } from '@mikro-orm/postgresql';
import { Client } from './client.entity';

export class ClientRepository extends EntityRepository<Client> {}
