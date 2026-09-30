import { CarTypeService } from '../src/carfleet/car-type.service';
import { CarClass } from '../src/carfleet/car-type.entity';
import { DriverSessionService } from '../src/tracking/driver-session.service';
import { anActiveDriver } from './support/driver.fixtures';
import { createTestApplication } from './support/test-application';

describe('Driver sessions', () => {
  let application: Awaited<ReturnType<typeof createTestApplication>>;
  beforeAll(async () => {
    application = await createTestApplication();
  });
  afterAll(async () => application.close());

  it('logs out once without removing a registered car', async () => {
    await application.run(async () => {
      const cars = application.app.get(CarTypeService);
      const sessions = application.app.get(DriverSessionService);
      const car = await cars.create({
        carClass: CarClass.REGULAR,
        description: 'Regular',
      });
      await cars.registerCar(CarClass.REGULAR);
      const driver = anActiveDriver();
      await application.orm.em.persist(driver).flush();
      const session = await sessions.logIn(
        driver.id,
        'WU123',
        CarClass.REGULAR,
        'Test',
      );
      await sessions.logOut(session.id);
      await sessions.logOut(session.id);
      expect(await cars.loadDto(car.id)).toEqual(
        expect.objectContaining({ carsCounter: 1, activeCarsCounter: 0 }),
      );
    });
  });
});
