import { Controller, Get, Param, Query } from '@nestjs/common';
import { DriverReportCreator } from '../driverreport/driver-report.creator';
import { DriverReportView } from '../driverreport/driver-report.view';

@Controller('driverreport')
export class DriverReportController {
  constructor(private readonly reports: DriverReportCreator) {}

  @Get(':driverId')
  public loadReportForDriver(
    @Param('driverId') driverId: string,
    @Query() query: { lastDays?: number | string },
  ): Promise<DriverReportView> {
    return this.reports.create(driverId, Number(query.lastDays ?? 0));
  }
}
