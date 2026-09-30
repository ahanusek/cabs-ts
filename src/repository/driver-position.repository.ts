import { EntityRepository, raw } from '@mikro-orm/postgresql';
import { DriverPosition } from '../entity/driver-position.entity';
import { Driver } from '../entity/driver.entity';
import { DriverPositionV2Dto } from '../dto/driver-position-v2.dto';

export class DriverPositionRepository extends EntityRepository<DriverPosition> {
  public async findAverageDriverPositionSince(
    latitudeMin: number,
    latitudeMax: number,
    longitudeMin: number,
    longitudeMax: number,
    date: number,
  ): Promise<DriverPositionV2Dto[]> {
    const qb = this.getEntityManager().createQueryBuilder(DriverPosition, 'dp');

    const results = await qb
      .select([
        'dp.driver',
        raw('avg(??)', ['dp.latitude']).as('avgLatitude'),
        raw('avg(??)', ['dp.longitude']).as('avgLongitude'),
        raw('max(??)', ['dp.seen_at']).as('maxSeenAt'),
      ])
      .where({
        longitude: { $gte: longitudeMin, $lte: longitudeMax },
        latitude: { $gte: latitudeMin, $lte: latitudeMax },
        seenAt: { $gte: date },
      })
      .groupBy('dp.driver')
      .execute<
        {
          driver: string;
          avgLatitude: number;
          avgLongitude: number;
          maxSeenAt: number;
        }[]
      >();

    const drivers = await this.getEntityManager().find(Driver, {
      id: { $in: results.map((position) => position.driver) },
    });
    const driversById = new Map(drivers.map((driver) => [driver.id, driver]));

    return results.map(
      (dp) =>
        new DriverPositionV2Dto(
          driversById.get(dp.driver)!,
          Number(dp.avgLatitude),
          Number(dp.avgLongitude),
          Number(dp.maxSeenAt),
        ),
    );
  }

  public async findByDriverAndSeenAtBetweenOrderBySeenAtAsc(
    driver: Driver,
    from: number,
    to: number,
  ): Promise<DriverPosition[]> {
    return this.find(
      {
        driver,
        seenAt: { $gte: from, $lte: to },
      },
      { orderBy: { seenAt: 'ASC' } },
    );
  }
}
