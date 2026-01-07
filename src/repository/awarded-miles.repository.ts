import { EntityRepository } from '@mikro-orm/postgresql';
import { AwardedMiles } from '../entity/awarded-miles.entity';
import { Client } from '../entity/client.entity';

export class AwardedMilesRepository extends EntityRepository<AwardedMiles> {
  public async findAllByClient(client: Client): Promise<AwardedMiles[]> {
    return this.find({ client });
  }
}
