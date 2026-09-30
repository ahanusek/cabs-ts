import { Injectable } from '@nestjs/common';

@Injectable()
export class DriverReportFeatures {
  public reconcile = process.env.DRIVER_REPORT_RECONCILE === 'true';

  public useSql = process.env.DRIVER_REPORT_SQL !== 'false';
}
