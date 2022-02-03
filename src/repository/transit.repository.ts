import { EntityRepository, Repository } from 'typeorm';
import { Status, Transit } from '../entity/transit.entity';
import { Driver } from '../entity/driver.entity';
import { Client } from '../entity/client.entity';
import { Address } from '../entity/address.entity';

@EntityRepository(Transit)
export class TransitRepository extends Repository<Transit> {
  public async findAllByDriverAndDateTimeBetween(
    driver: Driver,
    from: number,
    to: number,
  ): Promise<Transit[]> {
    // TODO: implement query (comment for fork)
    console.log({ driver, from, to });
    return [];
  }

  public async findAllByClientAndFromAndStatusOrderByDateTimeDesc(
    client: Client,
    from: Address,
    status: Status,
  ): Promise<Transit[]> {
    // TODO: implement query (comment for fork)
    console.log({ client, from, status });
    return [];
  }

  public async findAllByClientAndFromAndPublishedAfterAndStatusOrderByDateTimeDesc(
    client: Client,
    from: Address,
    when: number,
    status: Status,
  ): Promise<Transit[]> {
    // TODO: implement query (comment for fork)
    console.log({ client, from, when, status });
    return [];
  }

  public async findByClient(client: Client): Promise<Transit[]> {
    // TODO: implement query (comment for fork)
    console.log({ client });
    return [];
  }
}
