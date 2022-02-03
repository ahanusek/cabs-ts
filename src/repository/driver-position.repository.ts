import { EntityRepository, Repository } from 'typeorm';
import { DriverPosition } from '../entity/driver-position.entity';
import { Driver } from '../entity/driver.entity';
import { DriverPositionV2Dto } from '../dto/driver-position-v2.dto';

@EntityRepository(DriverPosition)
export class DriverPositionRepository extends Repository<DriverPosition> {
  public async findAverageDriverPositionSince(
    latitudeMin: number,
    latitudeMax: number,
    longitudeMin: number,
    longitudeMax: number,
    date: number,
  ): Promise<DriverPositionV2Dto[]> {
    //TODO: implement query (comment for fork)
    //SELECT new io.legacyfighter.cabs.dto.DriverPositionDTOV2(p.driver, avg(p.latitude), avg(p.longitude), max(p.seenAt)) FROM DriverPosition p where p.latitude between ?1 and ?2 and p.longitude between ?3 and ?4 and p.seenAt >= ?5 group by p.driver.id
    console.log({ latitudeMin, latitudeMax, longitudeMin, longitudeMax, date });
    return [];
  }

  public async findByDriverAndSeenAtBetweenOrderBySeenAtAsc(
    driver: Driver,
    from: number,
    to: number,
  ): Promise<DriverPosition[]> {
    //TODO: implement query (comment for fork)
    console.log({ driver, from, to });
    return [];
  }
}
