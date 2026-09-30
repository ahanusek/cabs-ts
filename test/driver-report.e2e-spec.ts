import dayjs from 'dayjs';
import { DriverReportController } from '../src/controllers/driver-report.controller';
import { DriverSession } from '../src/entity/driver-session.entity';
import {
  DriverAttribute,
  DriverAttributeName,
} from '../src/entity/driver-attribute.entity';
import { Claim, ClaimStatus } from '../src/entity/claim.entity';
import { CarClass } from '../src/entity/car-type.entity';
import { Money } from '../src/money/money';
import { aCompletedTransit, anActiveDriver } from './support/fixtures';
import { createTestApplication } from './support/test-application';

describe('Driver report', () => {
  let application: Awaited<ReturnType<typeof createTestApplication>>;
  let driverId: string;
  beforeAll(async () => {
    application = await createTestApplication();
    await application.run(async () => {
      const driver = anActiveDriver();
      driverId = driver.id;
      application.orm.em.persist([
        new DriverAttribute(driver, DriverAttributeName.COMPANY_NAME, 'Fleet'),
        new DriverAttribute(driver, DriverAttributeName.PENALTY_POINTS, '21'),
        new DriverAttribute(
          driver,
          DriverAttributeName.MEDICAL_EXAMINATION_REMARKS,
          'private info',
        ),
      ]);
      for (const daysAgo of [0, 1, 2]) {
        const start = dayjs()
          .startOf('day')
          .subtract(daysAgo, 'days')
          .add(10, 'hours')
          .valueOf();
        const session = new DriverSession();
        session.setDriver(driver);
        session.setLoggedAt(start);
        session.setLoggedOutAt(start + 7200000);
        session.setCarBrand(`Car ${daysAgo}`);
        session.setCarClass(CarClass.REGULAR);
        session.setPlatesNumber('WU123');
        const transit = aCompletedTransit(Money.fromMajor(80));
        transit.setDriver(driver);
        transit.setCompleteAt(start + 3600000);
        application.orm.em.persist([session, transit]);
        if (daysAgo === 2) {
          const claim = new Claim();
          claim.setOwner(transit.getClient());
          claim.setTransit(transit);
          claim.setClaimNo(claim.id);
          claim.setCreationDate(start);
          claim.setReason('Too fast');
          claim.setStatus(ClaimStatus.NEW);
          application.orm.em.persist(claim);
        }
      }
      await application.orm.em.flush();
    });
  });
  afterAll(async () => application.close());

  it.each([
    [0, 1],
    [1, 2],
    [2, 3],
  ])('includes sessions from the last %i days', async (days, count) => {
    expect((await report(days)).getSessions().size).toBe(count);
  });

  it('excludes private medical remarks', async () => {
    const result = await report(2);
    expect(
      result
        .getAttributes()
        .map((attribute) => attribute.getName())
        .sort(),
    ).toEqual(
      [
        DriverAttributeName.COMPANY_NAME,
        DriverAttributeName.PENALTY_POINTS,
      ].sort(),
    );
  });

  it('associates a claim with the transit in its session', async () => {
    const result = await report(2);
    const transits = [...result.getSessions()].find(
      ([session]) => session.getCarBrand() === 'Car 2',
    )![1];
    expect(
      transits.map((transit) => transit.getClaimDTO()?.getReason()),
    ).toEqual(['Too fast']);
  });

  it('retains drivers without attributes or sessions', async () => {
    const driver = anActiveDriver();
    await application.orm.em.fork().persist(driver).flush();
    const result = await report(0, driver.id);
    expect(result.getSessions().size).toBe(0);
  });

  it('serializes sessions into JSON', async () => {
    const result = JSON.parse(JSON.stringify(await report(2)));
    expect(result.sessions).toHaveLength(3);
  });

  function report(lastDays: number, id = driverId) {
    return application.run(() =>
      application.app
        .get(DriverReportController)
        .loadReportForDriver(id, { lastDays }),
    );
  }
});
