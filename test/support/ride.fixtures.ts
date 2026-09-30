import { CarClass, CarStatus } from '../../src/carfleet/car-type.entity';
import { CarTypeService } from '../../src/carfleet/car-type.service';
import { RideService } from '../../src/ride/ride.service';
import { AwardsService } from '../../src/loyalty/awards.service';
import { DriverSessionService } from '../../src/tracking/driver-session.service';
import { DriverTrackingService } from '../../src/tracking/driver-tracking.service';
import { DriverFee, FeeType } from '../../src/driverfleet/driver-fee.entity';
import { aClient } from './client.fixtures';
import { anActiveDriver } from './driver.fixtures';
import { anAddress } from './address.fixtures';
import type { createTestApplication } from './test-application';

type TestApplication = Awaited<ReturnType<typeof createTestApplication>>;

export class RideFixtures {
  constructor(private readonly application: TestApplication) {}

  public async requestRide() {
    const client = aClient();
    const from = anAddress();
    const to = anAddress();
    await this.application.orm.em.persist(client).flush();
    const request = await this.service().createTransitFromAddresses(
      client.id,
      from,
      to,
      CarClass.REGULAR,
    );
    await this.application.app.get(AwardsService).registerToProgram(client.id);
    return { id: request.id, clientId: client.id, from, to };
  }

  public async availableDriver() {
    const cars = this.application.app.get(CarTypeService);
    const car = await cars.create({
      carClass: CarClass.REGULAR,
      description: 'Regular',
    });
    if (car.getStatus() !== CarStatus.ACTIVE) {
      for (let index = car.getCarsCounter(); index < 10; index++)
        await cars.registerCar(CarClass.REGULAR);
      await cars.activate(car.id);
    }
    const driver = anActiveDriver();
    const fee = new DriverFee(FeeType.FLAT, driver, 10, 0);
    driver.setFee(fee);
    await this.application.orm.em.persist([driver, fee]).flush();
    await this.application.app
      .get(DriverSessionService)
      .logIn(driver.id, 'WU123', CarClass.REGULAR, 'Test');
    await this.application.app
      .get(DriverTrackingService)
      .registerPosition(driver.id, 1, 1, Date.now());
    return driver.id;
  }

  public async acceptedRide() {
    const ride = await this.requestRide();
    const driverId = await this.availableDriver();
    await this.service().publishTransit(ride.id);
    await this.service().acceptTransit(driverId, ride.id);
    return { ...ride, driverId };
  }

  public async startedRide() {
    const ride = await this.acceptedRide();
    await this.service().startTransit(ride.driverId, ride.id);
    return ride;
  }

  public cancelRide(id: string) {
    return this.service().cancelTransit(id);
  }
  public viewRide(id: string) {
    return this.service().loadTransit(id);
  }
  private service() {
    return this.application.app.get(RideService);
  }
}
