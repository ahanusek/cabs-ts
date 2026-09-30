import { DriverService } from '../src/service/driver.service';
import { DriverStatus } from '../src/entity/driver.entity';
import { createTestApplication } from './support/test-application';

const VALID_LICENSE = 'FARME100165AB5EW';
const REPLACEMENT_LICENSE = '99999740614992TL';

describe('Driver license behavior before extracting a value object', () => {
  let fixture: Awaited<ReturnType<typeof createTestApplication>>;
  let drivers: DriverService;

  beforeAll(async () => {
    fixture = await createTestApplication();
    drivers = fixture.app.get(DriverService);
  });

  afterAll(() => fixture.close());

  it('allows an inactive candidate to register with an unvalidated license', async () => {
    const driver = await fixture.run(() => register('invalid'));
    const loaded = await fixture.run(() => drivers.loadDriver(driver.id));
    expect(loaded).toEqual(
      expect.objectContaining({ driverLicense: 'invalid' }),
    );
  });

  it('activates a driver with a valid license', async () => {
    const driver = await fixture.run(() => register(VALID_LICENSE));
    await fixture.run(() =>
      drivers.changeDriverStatus(driver.id, DriverStatus.ACTIVE),
    );
    const loaded = await fixture.run(() => drivers.loadDriver(driver.id));
    expect(loaded).toEqual(
      expect.objectContaining({ status: DriverStatus.ACTIVE }),
    );
  });

  it('changes an active driver license', async () => {
    const driver = await fixture.run(() => register(VALID_LICENSE));
    await fixture.run(() =>
      drivers.changeDriverStatus(driver.id, DriverStatus.ACTIVE),
    );
    await fixture.run(() =>
      drivers.changeLicenseNumber(REPLACEMENT_LICENSE, driver.id),
    );
    const loaded = await fixture.run(() => drivers.loadDriver(driver.id));
    expect(loaded).toEqual(
      expect.objectContaining({ driverLicense: REPLACEMENT_LICENSE }),
    );
  });

  it('rejects an invalid replacement license', async () => {
    const driver = await fixture.run(() => register(VALID_LICENSE));
    await fixture.run(() =>
      drivers.changeDriverStatus(driver.id, DriverStatus.ACTIVE),
    );
    await expect(
      fixture.run(() => drivers.changeLicenseNumber('invalid', driver.id)),
    ).rejects.toThrow();
  });

  it('rejects changing the license of an inactive driver', async () => {
    const driver = await fixture.run(() => register(VALID_LICENSE));
    await expect(
      fixture.run(() =>
        drivers.changeLicenseNumber(REPLACEMENT_LICENSE, driver.id),
      ),
    ).rejects.toThrow();
  });

  it('rejects activating a driver with an invalid license', async () => {
    const driver = await fixture.run(() => register('invalid'));
    await expect(
      fixture.run(() =>
        drivers.changeDriverStatus(driver.id, DriverStatus.ACTIVE),
      ),
    ).rejects.toThrow();
  });

  function register(driverLicense: string) {
    return drivers.createDriver({
      driverLicense,
      firstName: 'Jan',
      lastName: 'Kowalski',
      photo: '',
    });
  }
});
