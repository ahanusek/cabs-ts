import { EntityRepository } from '@mikro-orm/postgresql';
import { AwardsAccount } from '../entity/awards-account.entity';
import { Client } from '../entity/client.entity';

export class AwardsAccountRepository extends EntityRepository<AwardsAccount> {
  public async findAllMilesBy(client: Client) {
    const account = await this.findByClient(client);
    return account?.getMiles() ?? [];
  }

  public async findByClient(client: Client): Promise<AwardsAccount | null> {
    return this.findOne({ client });
  }
}
