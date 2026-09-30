import {
  historicalRide,
  persistHistoricalRide,
} from './support/historical-ride.fixtures';
import { Status } from '../src/ride/details/status';
import { PopulateGraphService } from '../src/crm/transitanalyzer/populate-graph.service';
import { GraphTransitAnalyzer } from '../src/crm/transitanalyzer/graph-transit-analyzer';
import { CompletedTransitEdge } from '../src/crm/transitanalyzer/completed-transit-edge.entity';

import { anAddress } from './support/address.fixtures';
import { createTestApplication } from './support/test-application';

describe('Backfilling the graph from historical transits', () => {
  let application: Awaited<ReturnType<typeof createTestApplication>>;
  let first: ReturnType<typeof historicalRide>;
  let second: ReturnType<typeof historicalRide>;
  let incomplete: ReturnType<typeof historicalRide>;
  beforeAll(async () => {
    application = await createTestApplication();
    first = historicalRide({ started: 0, completeAt: 600000 });
    second = historicalRide({
      client: first.client,
      from: first.to,
      to: anAddress(),
      started: 900000,
      completeAt: 1200000,
    });
    incomplete = historicalRide();
    const draft = historicalRide({ status: Status.DRAFT });
    for (const ride of [first, second, incomplete, draft])
      await persistHistoricalRide(application.orm.em.fork(), ride);
  });
  afterAll(async () => application.close());

  it('reports records with missing timestamps', async () => {
    const result = await application.run(() =>
      application.app.get(PopulateGraphService).populate(),
    );
    expect(result).toEqual({
      projected: 2,
      skippedTransitIds: [incomplete.details.transitId],
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
        .analyze(first.client.id, first.from.getHash()),
    );
    expect(route).toEqual([
      first.from.getHash(),
      first.to.getHash(),
      second.to.getHash(),
    ]);
  });
});
