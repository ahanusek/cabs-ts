import { RideFixtures } from './support/ride.fixtures';

import { TransitDetailsFacade } from '../src/transitdetails/transit-details.facade';

import { Status, Transit } from '../src/entity/transit.entity';

import { createTestApplication } from './support/test-application';

describe('Transit details', () => {
  let application: Awaited<ReturnType<typeof createTestApplication>>;
  let rides: RideFixtures;
  beforeAll(async () => {
    application = await createTestApplication();
    rides = new RideFixtures(application);
  });
  afterAll(async () => application.close());

  it('reads a requested transit without loading its aggregate', async () => {
    await application.run(async () => {
      const transit = await rides.requestRide();
      await application.orm.em.nativeDelete(Transit, { id: transit.id });
      application.orm.em.clear();
      const view = await application.app
        .get(TransitDetailsFacade)
        .getView(transit.id);
      expect(view).toMatchObject({ id: transit.id, status: Status.DRAFT });
    });
  });

  it('updates the read model when a transit is cancelled', async () => {
    await application.run(async () => {
      const transit = await rides.requestRide();
      await rides.cancelRide(transit.id);
      application.orm.em.clear();
      expect(
        (await application.app.get(TransitDetailsFacade).getView(transit.id))
          .status,
      ).toBe(Status.CANCELLED);
    });
  });
});
