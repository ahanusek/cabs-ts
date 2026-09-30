import { CarTypeService } from '../src/service/car-type.service';
import { CarClass, CarStatus } from '../src/entity/car-type.entity';
import { createTestApplication } from './support/test-application';

describe('Car fleet behavior', () => {
  let fixture: Awaited<ReturnType<typeof createTestApplication>>;
  let cars: CarTypeService;
  beforeAll(async () => {
    fixture = await createTestApplication();
    cars = fixture.app.get(CarTypeService);
  });
  afterAll(() => fixture?.close());

  it('cannot activate a class before enough cars are registered', async () => {
    const car = await fixture.run(() =>
      cars.create({ carClass: CarClass.REGULAR, description: 'Regular' }),
    );
    await expect(fixture.run(() => cars.activate(car.id))).rejects.toThrow();
  });

  it('activates a class after ten registrations', async () => {
    const car = await fixture.run(() =>
      cars.create({ carClass: CarClass.VAN, description: 'Van' }),
    );
    for (let index = 0; index < 10; index++)
      await fixture.run(() => cars.registerCar(CarClass.VAN));
    await fixture.run(() => cars.activate(car.id));
    const loaded = await fixture.run(() => cars.load(car.id));
    expect(loaded.getStatus()).toBe(CarStatus.ACTIVE);
  });

  it('tracks active cars independently of registrations', async () => {
    const car = await fixture.run(() =>
      cars.create({ carClass: CarClass.PREMIUM, description: 'Premium' }),
    );
    await fixture.run(() => cars.registerActiveCar(CarClass.PREMIUM));
    await fixture.run(() => cars.registerActiveCar(CarClass.PREMIUM));
    await fixture.run(() => cars.unregisterActiveCar(CarClass.PREMIUM));
    const dto = await fixture.run(() => cars.loadDto(car.id));
    expect(dto).toEqual(expect.objectContaining({ activeCarsCounter: 1 }));
  });
});
