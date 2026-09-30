import type {
  ReportDriver,
  TransitView,
  ReportSession,
} from '../../transitdetails/transit-view';
export interface DriverReportView {
  driverDto: ReportDriver;
  attributes: { name: string; value: string }[];
  sessions: { session: ReportSession; transits: TransitView[] }[];
}
