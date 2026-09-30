import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import dayjs from 'dayjs';
import { DriverReportView } from './driver-report.view';
import { driverProjection, transitProjection } from './report-projections';

@Injectable()
export class SqlDriverReportCreator {
  constructor(private readonly em: EntityManager) {}

  public async create(
    driverId: string,
    lastDays: number,
  ): Promise<DriverReportView> {
    if (!Number.isInteger(lastDays) || lastDays < 0) {
      throw new BadRequestException('lastDays must be a non-negative integer');
    }
    const connection = this.em.getConnection();
    const drivers = await connection.execute<
      Pick<DriverReportView, 'driverDto' | 'attributes'>[]
    >(
      `
      select ${driverProjection('d')} as "driverDto",
        coalesce(jsonb_agg(jsonb_build_object('name', a.name, 'value', a.value)
          order by a.name, a.value) filter (where a.id is not null), '[]'::jsonb) as attributes
      from driver d
      left join driver_attribute a on a.driver_id = d.id and a.name <> ?
      where d.id = ? group by d.id`,
      ['medical_examination_remarks', driverId],
    );
    if (drivers.length === 0)
      throw new NotFoundException('Driver does not exist');
    const since = dayjs().startOf('day').subtract(lastDays, 'days').valueOf();
    const sessions = await connection.execute<DriverReportView['sessions']>(
      `
      select jsonb_build_object(
        'loggedAt', ds.logged_at, 'loggedOutAt', ds.logged_out_at,
        'platesNumber', ds.plates_number, 'carClass', ds.car_class, 'carBrand', ds.car_brand
      ) as session,
      coalesce(jsonb_agg(${transitProjection} order by t.complete_at, t.id)
        filter (where t.id is not null), '[]'::jsonb) as transits
      from driver_session ds
      left join transit t on t.driver_id = ds.driver_id and t.status = 'completed'
        and t.complete_at >= ds.logged_at and t.complete_at <= coalesce(ds.logged_out_at, ?)
      left join address af on af.id = t.from_id
      left join address ato on ato.id = t.to_id
      left join client c on c.id = t.client_id
      left join lateral (select * from claim where transit_id = t.id and owner_id = t.client_id
        order by creation_date, id limit 1) cl on true
      where ds.driver_id = ? and ds.logged_at > ?
      group by ds.id order by ds.logged_at, ds.id`,
      [Date.now(), driverId, since],
    );
    return { ...drivers[0], sessions };
  }
}
