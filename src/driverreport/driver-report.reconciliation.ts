import { Injectable, Logger } from '@nestjs/common';
import { isDeepStrictEqual } from 'node:util';
import { DriverReportView } from './driver-report.view';

export interface ReportComparator {
  compare(previous: DriverReportView, current: DriverReportView): boolean;
}

@Injectable()
export class DriverReportReconciliation implements ReportComparator {
  private readonly logger = new Logger(DriverReportReconciliation.name);

  public compare(
    previous: DriverReportView,
    current: DriverReportView,
  ): boolean {
    const matches = isDeepStrictEqual(
      normalizeReport(previous),
      normalizeReport(current),
    );
    if (!matches)
      this.logger.warn(`Driver report mismatch for ${current.driverDto.id}`);
    return matches;
  }
}

export function normalizeReport(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map(normalizeReport)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, normalizeReport(item)]),
    );
  }
  return value;
}
