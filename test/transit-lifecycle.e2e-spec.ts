import { GraphTransitAnalyzer } from '../src/crm/transitanalyzer/graph-transit-analyzer';
import { TransitService } from '../src/ride/transit.service';
import { Status } from '../src/ride/details/status';
import { RequestForTransit } from '../src/ride/request-for-transit.entity';
import { TransitDemand } from '../src/ride/transit-demand.entity';
import { Transit } from '../src/ride/transit.entity';
import { DriverAssignment } from '../src/assignment/driver-assignment.entity';
import { Invoice } from '../src/invoicing/invoice.entity';
import { RideFixtures } from './support/ride.fixtures';
import { createTestApplication } from './support/test-application';

describe('Ride lifecycle across domain boundaries', () => {
  let application: Awaited<ReturnType<typeof createTestApplication>>;
  let rides: RideFixtures;
  let service: TransitService;
  beforeAll(async () => {
    application = await createTestApplication();
    rides = new RideFixtures(application);
    service = application.app.get(TransitService);
  });
  afterAll(async () => application.close());

  it('cancels a draft request', async () =>
    application.run(async () => {
      const ride = await rides.requestRide();
      await rides.cancelRide(ride.id);
      expect((await rides.viewRide(ride.id)).status).toBe(Status.CANCELLED);
    }));

  it('starts an accepted ride and persists the four separate models', async () =>
    application.run(async () => {
      const ride = await rides.startedRide();
      application.orm.em.clear();
      const counts = await Promise.all([
        application.orm.em.count(RequestForTransit, { id: ride.id }),
        application.orm.em.count(TransitDemand, { requestId: ride.id }),
        application.orm.em.count(DriverAssignment, { requestId: ride.id }),
        application.orm.em.count(Transit, { requestId: ride.id }),
      ]);
      expect(counts).toEqual([1, 1, 1, 1]);
    }));

  it('rejects starting an unaccepted ride', async () =>
    application.run(async () => {
      const ride = await rides.requestRide();
      const driver = await rides.availableDriver();
      await expect(service.startTransit(driver, ride.id)).rejects.toThrow();
    }));

  it('rejects starting with a different driver', async () =>
    application.run(async () => {
      const ride = await rides.acceptedRide();
      const other = await rides.availableDriver();
      await expect(service.startTransit(other, ride.id)).rejects.toThrow(
        'not assigned',
      );
    }));

  it('rejects cancelling an accepted demand', async () =>
    application.run(async () => {
      const ride = await rides.acceptedRide();
      await expect(rides.cancelRide(ride.id)).rejects.toThrow();
    }));

  it('updates the graph after completion', async () =>
    application.run(async () => {
      const ride = await rides.startedRide();
      await service.completeTransit(ride.driverId, ride.id, ride.to);
      const route = await application.app
        .get(GraphTransitAnalyzer)
        .analyze(ride.clientId, ride.from.getHash());
      expect(route).toEqual([ride.from.getHash(), ride.to.getHash()]);
    }));

  it('rejects a second completion without issuing another invoice', async () => {
    const ride = await application.run(async () => {
      const ride = await rides.startedRide();
      await service.completeTransit(ride.driverId, ride.id, ride.to);
      return ride;
    });
    const count = await application.orm.em.fork().count(Invoice, {});
    const result = await Promise.allSettled([
      application.run(() =>
        service.completeTransit(ride.driverId, ride.id, ride.to),
      ),
    ]);
    expect([
      result[0].status,
      await application.orm.em.fork().count(Invoice, {}),
    ]).toEqual(['rejected', count]);
  });

  it('accepts only one of two simultaneous drivers', async () => {
    const setup = await application.run(async () => {
      const ride = await rides.requestRide();
      const first = await rides.availableDriver();
      const second = await rides.availableDriver();
      await service.publishTransit(ride.id);
      return { ride, first, second };
    });
    const results = await Promise.allSettled(
      [setup.first, setup.second].map((driver) =>
        application.run(() => service.acceptTransit(driver, setup.ride.id)),
      ),
    );
    expect(results.map((result) => result.status).sort()).toEqual([
      'fulfilled',
      'rejected',
    ]);
  });
});
