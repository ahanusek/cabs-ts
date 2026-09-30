import {
  historicalRide,
  persistHistoricalRide,
} from './support/historical-ride.fixtures';
import request from 'supertest';
import dayjs from 'dayjs';
import { DriverReportController } from '../src/driverfleet/driverreport/driver-report.controller';
import { DriverSession } from '../src/tracking/driver-session.entity';
import {
  DriverAttribute,
  DriverAttributeName,
} from '../src/driverfleet/driver-attribute.entity';
import { Claim, ClaimStatus } from '../src/crm/claims/claim.entity';
import { CarClass } from '../src/carfleet/car-type.entity';
import { Money } from '../src/money/money';
import { anActiveDriver } from './support/driver.fixtures';
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
        session.setDriverId(driver.id);
        session.setLoggedAt(start);
        session.setLoggedOutAt(start + 7200000);
        session.setCarBrand(`Car ${daysAgo}`);
        session.setCarClass(CarClass.REGULAR);
        session.setPlatesNumber('WU123');
        const ride = historicalRide({
          driver,
          completeAt: start + 3600000,
          price: Money.fromMajor(80),
        });
        application.orm.em.persist(session);
        await persistHistoricalRide(application.orm.em, ride);
        if (daysAgo === 0)
          await persistHistoricalRide(
            application.orm.em,
            historicalRide({
              driver,
              completeAt: start + 5400000,
              price: Money.fromMajor(90),
            }),
          );
        if (daysAgo === 2) {
          const claim = new Claim();
          claim.setOwner(ride.client.id, ride.client.getType());
          claim.setTransitId(ride.details.transitId);
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
    expect((await report(days)).sessions.length).toBe(count);
  });

  it('excludes private medical remarks', async () => {
    const result = await report(2);
    expect(result.attributes.map((attribute) => attribute.name).sort()).toEqual(
      [
        DriverAttributeName.COMPANY_NAME,
        DriverAttributeName.PENALTY_POINTS,
      ].sort(),
    );
  });

  it('associates a claim with the transit in its session', async () => {
    const result = await report(2);
    const transits = result.sessions.find(
      ({ session }) => session.carBrand === 'Car 2',
    )!.transits;
    expect(transits.map((transit) => transit.claimDto?.reason)).toEqual([
      'Too fast',
    ]);
  });

  it('retains drivers without attributes or sessions', async () => {
    const driver = anActiveDriver();
    await application.orm.em.fork().persist(driver).flush();
    const result = await report(0, driver.id);
    expect(result.sessions.length).toBe(0);
  });

  it('serializes sessions into JSON', async () => {
    const result = JSON.parse(JSON.stringify(await report(2)));
    expect(result.sessions).toHaveLength(3);
  });

  it('returns every transit from a session', async () => {
    const result = await report(0);
    expect(result.sessions[0].transits).toHaveLength(2);
  });

  it('accepts the report period as an HTTP query parameter', async () => {
    const response = await request(application.app.getHttpServer()).get(
      `/driverreport/${driverId}?lastDays=2`,
    );
    expect([response.status, response.body.sessions.length]).toEqual([200, 3]);
  });

  function report(lastDays: number, id = driverId) {
    return application.run(() =>
      application.app
        .get(DriverReportController)
        .loadReportForDriver(id, { lastDays }),
    );
  }
});
