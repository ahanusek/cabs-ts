import { DriverService } from '../src/driverfleet/driver.service';
import { TransitDetails } from '../src/transitdetails/transit-details.entity';
import { transitSnapshot } from '../src/transitdetails/transit-snapshot';
import { Money } from '../src/money/money';
import { Transit } from '../src/entity/transit.entity';
import { DriverFee, FeeType } from '../src/driverfleet/driver-fee.entity';
import { DriverFeeService } from '../src/driverfleet/driver-fee.service';
import { createTestApplication } from './support/test-application';
import { aCompletedTransit } from './support/transit.fixtures';

describe('Money persistence and driver fees', () => {
  let fixture: Awaited<ReturnType<typeof createTestApplication>>;
  beforeAll(async () => {
    fixture = await createTestApplication();
  });
  afterAll(() => fixture?.close());

  it('round-trips an amount with cents through PostgreSQL', async () => {
    const em = fixture.orm.em.fork();
    const transit = aCompletedTransit(new Money(1012));
    await em.persist(transit).flush();
    em.clear();
    const loaded = await em.findOneOrFail(Transit, transit.id);
    expect(loaded.getPrice()!.toInt()).toBe(1012);
  });

  it('persists the tariff selected when the transit was created', async () => {
    const em = fixture.orm.em.fork();
    const transit = aCompletedTransit(new Money(4400));
    transit.setDateTime(new Date('2021-12-31T12:00:00').getTime());
    await em.persist(transit).flush();
    em.clear();
    const loaded = await em.findOneOrFail(Transit, transit.id);
    expect(loaded.getTariff().getName()).toBe('Sylwester');
  });

  it('includes all twelve months and uses the fee recorded at completion', async () => {
    const transit = aCompletedTransit(new Money(4400));
    transit.setCompleteAt(new Date('2021-12-15T12:00:00').getTime());
    transit.setDriversFee(new Money(3400));
    await fixture.orm.em
      .fork()
      .persist([transit, new TransitDetails(transitSnapshot(transit))])
      .flush();
    const payments = await fixture.run(() =>
      fixture.app
        .get(DriverService)
        .calculateDriverYearlyPayment(transit.getDriver()!.id, 2021),
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
      const em = fixture.orm.em.fork();
      const transit = aCompletedTransit(new Money(4400));
      const driver = transit.getDriver()!;
      const fee = new DriverFee(type, driver, amount, minimum);
      driver.setFee(fee);
      await em.persist(transit).flush();
      const result = await fixture.run(() =>
        fixture.app
          .get(DriverFeeService)
          .calculateDriverFee(driver.id, transit.getPrice()!),
      );
      expect(result.toInt()).toBe(expected);
    },
  );
});
