import { EntityRepository } from '@mikro-orm/postgresql';
import { AwardsAccount } from '../entity/awards-account.entity';
import { Client } from '../entity/client.entity';

export class AwardsAccountRepository extends EntityRepository<AwardsAccount> {
  public async findByClient(client: Client): Promise<AwardsAccount | null> {
    return this.findOne({ client });
  }
}
