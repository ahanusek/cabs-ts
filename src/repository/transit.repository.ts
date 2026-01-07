import { EntityRepository } from '@mikro-orm/postgresql';
import { Status, Transit } from '../entity/transit.entity';
import { Driver } from '../entity/driver.entity';
import { Client } from '../entity/client.entity';
import { Address } from '../entity/address.entity';

export class TransitRepository extends EntityRepository<Transit> {
  public async findAllByDriverAndDateTimeBetween(
    driver: Driver,
    from: number,
    to: number,
  ): Promise<Transit[]> {
    return this.find({
      driver,
      dateTime: { $gte: from, $lte: to },
    });
  }

  public async findAllByClientAndFromAndStatusOrderByDateTimeDesc(
    client: Client,
    from: Address,
    status: Status,
  ): Promise<Transit[]> {
    return this.find(
      { client, from, status },
      { orderBy: { dateTime: 'DESC' } },
    );
  }

  public async findAllByClientAndFromAndPublishedAfterAndStatusOrderByDateTimeDesc(
    client: Client,
    from: Address,
    when: number,
    status: Status,
  ): Promise<Transit[]> {
    return this.find(
      { client, from, status, published: { $gte: when } },
      { orderBy: { dateTime: 'DESC' } },
    );
  }

  public async findByClient(client: Client): Promise<Transit[]> {
    return this.find({ client });
  }
}
