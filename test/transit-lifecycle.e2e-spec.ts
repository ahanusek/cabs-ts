import { TransitService } from '../src/service/transit.service';
import { Status, Transit } from '../src/entity/transit.entity';
import { Money } from '../src/money/money';
import { aCompletedTransit } from './support/fixtures';
import { createTestApplication } from './support/test-application';

describe('Transit lifecycle through the application service', () => {
  let fixture: Awaited<ReturnType<typeof createTestApplication>>;
  let service: TransitService;
  beforeAll(async () => {
    fixture = await createTestApplication();
    service = fixture.app.get(TransitService);
  });
  afterAll(() => fixture?.close());

  it('cancels a draft and clears its assigned driver', async () => {
    const transit = await givenTransit(Status.DRAFT);
    await fixture.run(() => service.cancelTransit(transit.id));
    const loaded = await fixture.orm.em
      .fork()
      .findOneOrFail(Transit, transit.id);
    expect([loaded.getStatus(), loaded.getDriver()]).toEqual([
      Status.CANCELLED,
      null,
    ]);
  });

  it('rejects cancelling a completed transit', async () => {
    const transit = await givenTransit(Status.COMPLETED);
    await expect(
      fixture.run(() => service.cancelTransit(transit.id)),
    ).rejects.toThrow();
  });

  it('starts an accepted transit', async () => {
    const transit = await givenTransit(Status.TRANSIT_TO_PASSENGER);
    await fixture.run(() =>
      service.startTransit(transit.getDriver()!.id, transit.id),
    );
    const loaded = await fixture.orm.em
      .fork()
      .findOneOrFail(Transit, transit.id);
    expect(loaded.getStatus()).toBe(Status.IN_TRANSIT);
  });

  it('rejects starting an unaccepted transit', async () => {
    const transit = await givenTransit(Status.DRAFT);
    await expect(
      fixture.run(() =>
        service.startTransit(transit.getDriver()!.id, transit.id),
      ),
    ).rejects.toThrow();
  });

  async function givenTransit(status: Status) {
    const transit = aCompletedTransit(new Money(4400));
    transit.setStatus(status);
    await fixture.orm.em.fork().persist(transit).flush();
    return transit;
  }
});
