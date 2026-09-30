import { TransitService } from '../src/ride/transit.service';
import { AddressDto } from '../src/geolocation/address/address.dto';
import { RideFixtures } from './support/ride.fixtures';
import { anAddress } from './support/address.fixtures';
import { createTestApplication } from './support/test-application';

describe('Changing ride addresses', () => {
  let application: Awaited<ReturnType<typeof createTestApplication>>;
  let rides: RideFixtures;
  let service: TransitService;
  beforeAll(async () => {
    application = await createTestApplication();
    rides = new RideFixtures(application);
    service = application.app.get(TransitService);
  });
  afterAll(async () => application.close());

  it('updates the pickup while waiting for a driver', async () =>
    application.run(async () => {
      const ride = await rides.requestRide();
      await rides.availableDriver();
      await service.publishTransit(ride.id);
      const pickup = anAddress();
      pickup.setStreet('Nowa');
      pickup.setHash();
      await service._changeTransitAddressFrom(ride.id, pickup);
      expect((await rides.viewRide(ride.id)).from.street).toBe('Nowa');
    }));

  it('rolls back a pickup change after acceptance', async () => {
    const ride = await application.run(() => rides.acceptedRide());
    const pickup = anAddress();
    pickup.setStreet('Forbidden');
    pickup.setHash();
    const results = await Promise.allSettled([
      application.run(() => service._changeTransitAddressFrom(ride.id, pickup)),
    ]);
    const view = await application.run(() => rides.viewRide(ride.id));
    expect([results[0].status, view.from.street]).toEqual([
      'rejected',
      ride.from.getStreet(),
    ]);
  });

  it('updates the destination during the ride', async () =>
    application.run(async () => {
      const ride = await rides.startedRide();
      const destination = anAddress();
      destination.setStreet('Destination');
      destination.setHash();
      await service.changeTransitAddressTo(
        ride.id,
        new AddressDto(destination),
      );
      expect((await rides.viewRide(ride.id)).to.street).toBe('Destination');
    }));

  it('rejects a destination change after completion', async () =>
    application.run(async () => {
      const ride = await rides.startedRide();
      await service.completeTransit(ride.driverId, ride.id, ride.to);
      await expect(
        service.changeTransitAddressTo(ride.id, new AddressDto(anAddress())),
      ).rejects.toThrow();
    }));
});
