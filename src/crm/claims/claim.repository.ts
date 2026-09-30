import { EntityRepository } from '@mikro-orm/postgresql';
import { Claim } from './claim.entity';

export class ClaimRepository extends EntityRepository<Claim> {
  public countByClient(clientId: string) {
    return this.count({ clientId });
  }
}
