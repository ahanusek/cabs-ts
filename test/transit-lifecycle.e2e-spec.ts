import { AwardsService } from '../src/loyalty/awards.service';
import { GraphTransitAnalyzer } from '../src/transitanalyzer/graph-transit-analyzer';
import { DriverFee, FeeType } from '../src/driverfleet/driver-fee.entity';
import { TransitService } from '../src/service/transit.service';
import { Status, Transit } from '../src/entity/transit.entity';
import { Money } from '../src/money/money';
import { aCompletedTransit } from './support/transit.fixtures';
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

  it('updates the graph when an in-progress transit completes', async () => {
    const transit = await givenTransit(Status.IN_TRANSIT);
    await fixture.run(async () => {
      const managed = await fixture.orm.em.findOneOrFail(Transit, transit.id);
      managed.started = Date.now() - 1000;
      const fee = new DriverFee(FeeType.FLAT, managed.getDriver()!, 10, 0);
      managed.getDriver()!.setFee(fee);
      await fixture.orm.em.persist(fee).flush();
      await fixture.app
        .get(AwardsService)
        .registerToProgram(managed.getClient().id);
    });
    await fixture.run(() =>
      service.completeTransit(
        transit.getDriver()!.id,
        transit.id,
        transit.getTo(),
      ),
    );
    const route = await fixture.run(() =>
      fixture.app
        .get(GraphTransitAnalyzer)
        .analyze(transit.getClient().id, transit.getFrom().getHash()),
    );
    expect(route).toEqual([
      transit.getFrom().getHash(),
      transit.getTo().getHash(),
    ]);
  });

  async function givenTransit(status: Status) {
    const transit = aCompletedTransit(new Money(4400));
    transit.setStatus(status);
    await fixture.orm.em.fork().persist(transit).flush();
    return transit;
  }
});
