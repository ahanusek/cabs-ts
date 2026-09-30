import { EntityRepository } from '@mikro-orm/postgresql';
import { AwardsAccount } from './awards-account.entity';

export class AwardsAccountRepository extends EntityRepository<AwardsAccount> {
  public async findAllMilesBy(clientId: string) {
    const account = await this.findByClient(clientId);
    return account?.getMiles() ?? [];
  }

  public async findByClient(clientId: string): Promise<AwardsAccount | null> {
    return this.findOne({ clientId });
  }
}
