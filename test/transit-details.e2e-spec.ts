import { TransitService } from '../src/service/transit.service';
import { TransitDetailsFacade } from '../src/transitdetails/transit-details.facade';
import { CarClass } from '../src/entity/car-type.entity';
import { Status, Transit } from '../src/entity/transit.entity';
import { aClient, anAddress } from './support/fixtures';
import { createTestApplication } from './support/test-application';

describe('Transit details', () => {
  let application: Awaited<ReturnType<typeof createTestApplication>>;
  beforeAll(async () => {
    application = await createTestApplication();
  });
  afterAll(async () => application.close());

  it('reads a requested transit without loading its aggregate', async () => {
    await application.run(async () => {
      const transit = await requestTransit();
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
      const transit = await requestTransit();
      await application.app.get(TransitService).cancelTransit(transit.id);
      application.orm.em.clear();
      expect(
        (await application.app.get(TransitDetailsFacade).getView(transit.id))
          .status,
      ).toBe(Status.CANCELLED);
    });
  });

  async function requestTransit() {
    const client = aClient();
    const from = anAddress();
    const to = anAddress();
    await application.orm.em.persist([client, from, to]).flush();
    return application.app
      .get(TransitService)
      ._createTransit(client.id, from, to, CarClass.REGULAR);
  }
});
