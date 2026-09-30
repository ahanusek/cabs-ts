import { EntityRepository, raw } from '@mikro-orm/postgresql';
import { DriverPosition } from './driver-position.entity';

import { DriverPositionV2Dto } from './driver-position-v2.dto';

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
        'dp.driverId',
        raw('avg(??)', ['dp.latitude']).as('avgLatitude'),
        raw('avg(??)', ['dp.longitude']).as('avgLongitude'),
        raw('max(??)', ['dp.seen_at']).as('maxSeenAt'),
      ])
      .where({
        longitude: { $gte: longitudeMin, $lte: longitudeMax },
        latitude: { $gte: latitudeMin, $lte: latitudeMax },
        seenAt: { $gte: date },
      })
      .groupBy('dp.driverId')
      .execute<
        {
          driverId: string;
          avgLatitude: number;
          avgLongitude: number;
          maxSeenAt: number;
        }[]
      >();

    return results.map(
      (dp) =>
        new DriverPositionV2Dto(
          dp.driverId,
          Number(dp.avgLatitude),
          Number(dp.avgLongitude),
          Number(dp.maxSeenAt),
        ),
    );
  }

  public async findByDriverAndSeenAtBetweenOrderBySeenAtAsc(
    driverId: string,
    from: number,
    to: number,
  ): Promise<DriverPosition[]> {
    return this.find(
      {
        driverId,
        seenAt: { $gte: from, $lte: to },
      },
      { orderBy: { seenAt: 'ASC' } },
    );
  }
}
