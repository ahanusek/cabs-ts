import { Money } from '../src/money/money';
import { Transit } from '../src/entity/transit.entity';
import { DriverFee, FeeType } from '../src/entity/driver-fee.entity';
import { DriverFeeService } from '../src/service/driver-fee.service';
import { createTestApplication } from './support/test-application';
import { aCompletedTransit } from './support/fixtures';

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
        fixture.app.get(DriverFeeService).calculateDriverFee(transit.id),
      );
      expect(result.toInt()).toBe(expected);
    },
  );
});
