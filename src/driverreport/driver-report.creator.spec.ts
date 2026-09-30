import { DriverReportCreator } from './driver-report.creator';
import { DriverReportFeatures } from './driver-report.features';
import { DriverReportView } from './driver-report.view';

const report: DriverReportView = {
  driverDto: {
    id: 'driver',
    firstName: 'Jan',
    lastName: 'Nowak',
    driverLicense: 'license',
    photo: null,
    status: 'active',
    type: 'regular',
  },
  attributes: [],
  sessions: [],
};

describe('Parallel driver report models', () => {
  it.each([true, false])(
    'selects the configured model when useSql is %s',
    async (useSql) => {
      const sql = { create: jest.fn(async () => report) };
      const legacy = { create: jest.fn(async () => report) };
      const features = new DriverReportFeatures();
      features.useSql = useSql;
      await new DriverReportCreator(sql, legacy, features).create('driver', 7);
      expect([
        sql.create.mock.calls.length,
        legacy.create.mock.calls.length,
      ]).toEqual(useSql ? [1, 0] : [0, 1]);
    },
  );
});
