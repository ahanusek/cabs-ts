import { Status, Transit } from '../src/entity/transit.entity';
import { PopulateGraphService } from '../src/transitanalyzer/populate-graph.service';
import { GraphTransitAnalyzer } from '../src/transitanalyzer/graph-transit-analyzer';
import { CompletedTransitEdge } from '../src/transitanalyzer/completed-transit-edge.entity';
import { Money } from '../src/money/money';
import { aCompletedTransit } from './support/transit.fixtures';
import { anAddress } from './support/address.fixtures';
import { createTestApplication } from './support/test-application';

describe('Backfilling the graph from historical transits', () => {
  let application: Awaited<ReturnType<typeof createTestApplication>>;
  let first: Transit;
  let second: Transit;
  let incomplete: Transit;
  beforeAll(async () => {
    application = await createTestApplication();
    first = aCompletedTransit(Money.fromMajor(50));
    first.started = 0;
    first.setCompleteAt(600000);
    second = aCompletedTransit(Money.fromMajor(50));
    second.setClient(first.getClient());
    second.setFrom(first.getTo());
    second.setTo(anAddress());
    second.started = 900000;
    second.setCompleteAt(1200000);
    incomplete = aCompletedTransit(Money.fromMajor(50));
    const draft = aCompletedTransit(Money.fromMajor(50));
    draft.setStatus(Status.DRAFT);
    await application.orm.em
      .fork()
      .persist([first, second, incomplete, draft])
      .flush();
  });
  afterAll(async () => application.close());

  it('reports records with missing timestamps', async () => {
    const result = await application.run(() =>
      application.app.get(PopulateGraphService).populate(),
    );
    expect(result).toEqual({
      projected: 2,
      skippedTransitIds: [incomplete.id],
    });
  });

  it('can be replayed without duplicating graph edges', async () => {
    await application.run(() =>
      application.app.get(PopulateGraphService).populate(),
    );
    await application.run(() =>
      application.app.get(PopulateGraphService).populate(),
    );
    expect(
      await application.orm.em.fork().count(CompletedTransitEdge, {}),
    ).toBe(2);
  });

  it('makes historical routes available to the graph query', async () => {
    await application.run(() =>
      application.app.get(PopulateGraphService).populate(),
    );
    const route = await application.run(() =>
      application.app
        .get(GraphTransitAnalyzer)
        .analyze(first.getClient().id, first.getFrom().getHash()),
    );
    expect(route).toEqual([
      first.getFrom().getHash(),
      first.getTo().getHash(),
      second.getTo().getHash(),
    ]);
  });
});
