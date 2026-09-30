import { DriverReportReconciliation } from './driver-report.reconciliation';
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
  it('detects a changed driver field', () => {
    const changed = {
      ...report,
      driverDto: { ...report.driverDto, lastName: 'Different' },
    };
    expect(new DriverReportReconciliation().compare(report, changed)).toBe(
      false,
    );
  });

  it('ignores attribute ordering while comparing report contents', () => {
    const attributes = [
      { name: 'companyName', value: 'Fleet' },
      { name: 'penalty_points', value: '2' },
    ];
    expect(
      new DriverReportReconciliation().compare(
        { ...report, attributes },
        { ...report, attributes: [...attributes].reverse() },
      ),
    ).toBe(true);
  });

  it.each([true, false])(
    'compares both results once with useSql %s',
    async (useSql) => {
      const sqlReport = {
        ...report,
        attributes: [{ name: 'companyName', value: 'New' }],
      };
      const sql = { create: jest.fn(async () => sqlReport) };
      const legacy = { create: jest.fn(async () => report) };
      const comparison = { compare: jest.fn(() => false) };
      const features = new DriverReportFeatures();
      features.useSql = useSql;
      features.reconcile = true;
      const result = await new DriverReportCreator(
        sql,
        legacy,
        features,
        comparison,
      ).create('driver', 7);
      expect({
        result,
        calls: [
          sql.create.mock.calls.length,
          legacy.create.mock.calls.length,
          comparison.compare.mock.calls.length,
        ],
      }).toEqual({ result: useSql ? sqlReport : report, calls: [1, 1, 1] });
    },
  );

  it.each([true, false])(
    'selects the configured model when useSql is %s',
    async (useSql) => {
      const sql = { create: jest.fn(async () => report) };
      const legacy = { create: jest.fn(async () => report) };
      const features = new DriverReportFeatures();
      features.useSql = useSql;
      await new DriverReportCreator(sql, legacy, features, {
        compare: () => true,
      }).create('driver', 7);
      expect([
        sql.create.mock.calls.length,
        legacy.create.mock.calls.length,
      ]).toEqual(useSql ? [1, 0] : [0, 1]);
    },
  );
});
