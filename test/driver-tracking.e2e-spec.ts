import { TravelledDistanceService } from '../src/driverreport/travelled-distance/travelled-distance.service';
import { NotAcceptableException } from '@nestjs/common';
import { DriverTrackingService } from '../src/service/driver-tracking.service';
import { DriverStatus } from '../src/driverfleet/driver.entity';
import { anActiveDriver } from './support/driver.fixtures';
import { createTestApplication } from './support/test-application';

const noon = Date.UTC(1989, 11, 12, 12, 10);
const fiveMinutes = 300000;
const start = [53.32055555555556, -1.729722222222222] as const;
const destination = [53.31861111111111, -1.699722222222222] as const;

describe('Driver travelled distance', () => {
  let application: Awaited<ReturnType<typeof createTestApplication>>;
  let tracking: DriverTrackingService;
  let driverId: string;
  beforeAll(async () => {
    application = await createTestApplication();
    tracking = application.app.get(DriverTrackingService);
  });
  afterAll(async () => application.close());
  beforeEach(async () => {
    const driver = anActiveDriver();
    driverId = driver.id;
    await application.orm.em.fork().persist(driver).flush();
  });

  it('returns zero without positions', async () => {
    expect(await distance(noon, noon + fiveMinutes)).toBe('0km');
  });

  it('returns zero for a single position', async () => {
    await position(start, noon);
    expect(await distance(noon, noon + fiveMinutes)).toBe('0km');
  });

  it.each([
    [1, '4.009km'],
    [2, '8.017km'],
    [3, '12.026km'],
  ])('sums distance over %i intervals', async (intervals, expected) => {
    for (let interval = 0; interval < intervals; interval++) {
      const time = noon + interval * fiveMinutes;
      await position(start, time);
      await position(destination, time + 1);
      await position(start, time + 2);
    }
    expect(await distance(noon, noon + intervals * fiveMinutes)).toBe(expected);
  });

  it('excludes points outside the requested time range', async () => {
    await position(start, noon - 1);
    await position(destination, noon);
    expect(await distance(noon, noon + fiveMinutes)).toBe('0km');
  });

  it('rejects positions for inactive drivers', async () => {
    const driver = anActiveDriver();
    driver.setStatus(DriverStatus.INACTIVE);
    await application.orm.em.fork().persist(driver).flush();
    await expect(
      application.run(() =>
        tracking.registerPosition(driver.id, ...start, noon),
      ),
    ).rejects.toBeInstanceOf(NotAcceptableException);
  });

  it('recalculates the interval when a position arrives late', async () => {
    await position(start, noon);
    await position(start, noon + 2);
    await position(destination, noon + 1);
    expect(await distance(noon, noon + fiveMinutes)).toBe('4.009km');
  });

  it('does not double-count a replayed position', async () => {
    await position(start, noon);
    const sample = await position(destination, noon + 1);
    await application.run(() =>
      application.app.get(TravelledDistanceService).addPosition(driverId, {
        id: sample.id,
        latitude: sample.getLatitude(),
        longitude: sample.getLongitude(),
        seenAt: sample.getSeenAt(),
      }),
    );
    expect(await distance(noon, noon + fiveMinutes)).toBe('2.004km');
  });

  async function position(
    coordinates: readonly [number, number],
    time: number,
  ) {
    return application.run(() =>
      tracking.registerPosition(driverId, ...coordinates, time),
    );
  }

  async function distance(from: number, to: number) {
    return (
      await application.run(() =>
        tracking.calculateTravelledDistance(driverId, from, to),
      )
    ).printIn('km');
  }
});
