import { Controller, Get, Param, Query } from '@nestjs/common';
import { SqlDriverReportCreator } from './sql-driver-report.creator';
import { DriverReportView } from './driver-report.view';

@Controller('driverreport')
export class DriverReportController {
  constructor(private readonly reports: SqlDriverReportCreator) {}

  @Get(':driverId')
  public loadReportForDriver(
    @Param('driverId') driverId: string,
    @Query() query: { lastDays?: number | string },
  ): Promise<DriverReportView> {
    return this.reports.create(driverId, Number(query.lastDays ?? 0));
  }
}
