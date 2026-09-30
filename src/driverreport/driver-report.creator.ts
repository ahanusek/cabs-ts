import { Inject, Injectable } from '@nestjs/common';
import { DriverReportView } from './driver-report.view';
import { DriverReportFeatures } from './driver-report.features';
import { LegacyDriverReportCreator } from './legacy-driver-report.creator';
import { SqlDriverReportCreator } from './sql-driver-report.creator';

export interface ReportSource {
  create(driverId: string, lastDays: number): Promise<DriverReportView>;
}

@Injectable()
export class DriverReportCreator implements ReportSource {
  constructor(
    @Inject(SqlDriverReportCreator) private readonly sql: ReportSource,
    @Inject(LegacyDriverReportCreator) private readonly legacy: ReportSource,
    private readonly features: DriverReportFeatures,
  ) {}

  public create(driverId: string, lastDays: number): Promise<DriverReportView> {
    const source = this.features.useSql ? this.sql : this.legacy;
    return source.create(driverId, lastDays);
  }
}
