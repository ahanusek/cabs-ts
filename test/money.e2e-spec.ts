import { Money } from '../src/money/money';
import { DriverFee, FeeType } from '../src/driverfleet/driver-fee.entity';
import { DriverFeeService } from '../src/driverfleet/driver-fee.service';
import { DriverService } from '../src/driverfleet/driver.service';
import { RequestForTransit } from '../src/ride/request-for-transit.entity';
import { Tariff } from '../src/pricing/tariff';
import { Distance } from '../src/geolocation/distance';
import { createTestApplication } from './support/test-application';
import {
  historicalRide,
  persistHistoricalRide,
} from './support/historical-ride.fixtures';
import { anActiveDriver } from './support/driver.fixtures';

describe('Money persistence and driver fees', () => {
  let fixture: Awaited<ReturnType<typeof createTestApplication>>;
  beforeAll(async () => {
    fixture = await createTestApplication();
  });
  afterAll(async () => fixture.close());

  it('round-trips an amount with cents through PostgreSQL', async () => {
    const em = fixture.orm.em.fork();
    const fee = new DriverFee(FeeType.FLAT, anActiveDriver(), 1, 10.12);
    await em.persist(fee).flush();
    em.clear();
    expect((await em.findOneOrFail(DriverFee, fee.id)).getMin().toInt()).toBe(
      1012,
    );
  });

  it('persists the tariff selected for the original estimate', async () => {
    const em = fixture.orm.em.fork();
    const request = new RequestForTransit(
      Tariff.ofTime(new Date('2021-12-31T12:00:00')),
      Distance.ofKm(10),
    );
    await em.persist(request).flush();
    em.clear();
    expect(
      (await em.findOneOrFail(RequestForTransit, request.id))
        .getEstimatedPrice()
        .toMajor(),
    ).toBe(46);
  });

  it('includes all twelve months and uses the fee recorded at completion', async () => {
    const ride = historicalRide({
      completeAt: new Date('2021-12-15T12:00:00').getTime(),
    });
    ride.details.view.driverFee = 34;
    await persistHistoricalRide(fixture.orm.em.fork(), ride);
    const payments = await fixture.run(() =>
      fixture.app
        .get(DriverService)
        .calculateDriverYearlyPayment(ride.driver.id, 2021),
    );
    expect([...payments]).toEqual(
      Array.from({ length: 12 }, (_, index) => [
        index + 1,
        index === 11 ? 34 : 0,
      ]),
    );
  });

  it.each([
    [FeeType.FLAT, 10, 0, 3400],
    [FeeType.PERCENTAGE, 30, 0, 1320],
    [FeeType.PERCENTAGE, 30, 20, 2000],
  ])(
    'calculates %s fees including the minimum',
    async (type, amount, minimum, expected) => {
      const driver = anActiveDriver();
      await fixture.orm.em
        .fork()
        .persist(new DriverFee(type, driver, amount, minimum))
        .flush();
      const fee = await fixture.run(() =>
        fixture.app
          .get(DriverFeeService)
          .calculateDriverFee(driver.id, new Money(4400)),
      );
      expect(fee.toInt()).toBe(expected);
    },
  );
});
