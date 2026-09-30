import { randomUUID } from 'node:crypto';
import { GraphTransitAnalyzer } from '../src/crm/transitanalyzer/graph-transit-analyzer';
import { createTestApplication } from './support/test-application';

const minute = 60000;
type Edge = readonly [
  from: string,
  to: string,
  started: number,
  completeAt: number,
];

describe('Graph transit read model', () => {
  let application: Awaited<ReturnType<typeof createTestApplication>>;
  beforeAll(async () => {
    application = await createTestApplication();
  });
  afterAll(async () => application.close());

  it.each([
    [
      'chain',
      [
        ['A', 'B', 0, 10],
        ['B', 'C', 15, 20],
        ['C', 'D', 25, 30],
      ],
      ['A', 'B', 'C', 'D'],
    ],
    [
      'address loop',
      [
        ['A', 'B', 0, 10],
        ['B', 'A', 15, 20],
        ['A', 'C', 25, 30],
      ],
      ['A', 'B', 'A', 'C'],
    ],
    [
      'long stop',
      [
        ['A', 'B', 0, 10],
        ['B', 'C', 26, 30],
      ],
      ['A', 'B'],
    ],
    [
      'exactly fifteen minutes',
      [
        ['A', 'B', 0, 10],
        ['B', 'C', 25, 30],
      ],
      ['A', 'B', 'C'],
    ],
    [
      'overlapping transits',
      [
        ['A', 'B', 0, 20],
        ['B', 'C', 10, 30],
      ],
      ['A', 'B'],
    ],
    ['empty history', [], []],
  ] as const)('analyzes %s', async (_name, edges, expected) => {
    const clientId = await addEdges(edges);
    const result = await application.run(() =>
      application.app.get(GraphTransitAnalyzer).analyze(clientId, 'A'),
    );
    expect(result).toEqual(expected);
  });

  it('filters the client on the first edge as well as subsequent edges', async () => {
    const clientId = await addEdges([['A', 'B', 0, 10]]);
    await addEdges([
      ['A', 'B', 0, 10],
      ['B', 'C', 15, 20],
    ]);
    const result = await application.run(() =>
      application.app.get(GraphTransitAnalyzer).analyze(clientId, 'A'),
    );
    expect(result).toEqual(['A', 'B']);
  });

  it('replays an event without creating another edge', async () => {
    const event = {
      transitId: randomUUID(),
      clientId: randomUUID(),
      fromHash: 'A',
      toHash: 'A',
      started: 0,
      completeAt: 0,
    };
    await application.run(async () => {
      const graph = application.app.get(GraphTransitAnalyzer);
      await graph.addTransitBetweenAddresses(event);
      await graph.addTransitBetweenAddresses(event);
    });
    expect(
      await application.run(() =>
        application.app.get(GraphTransitAnalyzer).analyze(event.clientId, 'A'),
      ),
    ).toEqual(['A', 'A']);
  });

  async function addEdges(edges: readonly Edge[]): Promise<string> {
    const clientId = randomUUID();
    await application.run(async () => {
      for (const [fromHash, toHash, started, completeAt] of edges) {
        await application.app
          .get(GraphTransitAnalyzer)
          .addTransitBetweenAddresses({
            transitId: randomUUID(),
            clientId,
            fromHash,
            toHash,
            started: started * minute,
            completeAt: completeAt * minute,
          });
      }
    });
    return clientId;
  }
});
