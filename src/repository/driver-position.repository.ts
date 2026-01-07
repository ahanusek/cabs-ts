import { EntityRepository } from '@mikro-orm/postgresql';
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
      .select(['dp.driver', 'avg(dp.latitude) as avgLatitude', 'avg(dp.longitude) as avgLongitude', 'max(dp.seenAt) as maxSeenAt'])
      .leftJoinAndSelect('dp.driver', 'd')
      .where({
        longitude: { $gte: longitudeMin, $lte: longitudeMax },
        latitude: { $gte: latitudeMin, $lte: latitudeMax },
        seenAt: { $gte: date },
      })
      .groupBy('dp.driver')
      .execute();

    return results.map(
      (dp: any) =>
        new DriverPositionV2Dto(
          dp.driver,
          dp.avgLatitude,
          dp.avgLongitude,
          dp.maxSeenAt,
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
