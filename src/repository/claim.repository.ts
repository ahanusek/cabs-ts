import { EntityRepository } from '@mikro-orm/postgresql';
import { Claim } from '../entity/claim.entity';
import { Client } from '../entity/client.entity';
import { Transit } from '../entity/transit.entity';

export class ClaimRepository extends EntityRepository<Claim> {
  public async findByOwner(owner: Client): Promise<Claim[]> {
    return this.find({ owner });
  }

  public async findByOwnerAndTransit(owner: Client, transit: Transit): Promise<Claim[]> {
    return this.find({ owner, transit });
  }
}
