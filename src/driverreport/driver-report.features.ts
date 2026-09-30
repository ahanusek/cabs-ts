import { Injectable } from '@nestjs/common';

@Injectable()
export class DriverReportFeatures {
  public useSql = process.env.DRIVER_REPORT_SQL !== 'false';
}
