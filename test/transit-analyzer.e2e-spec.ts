import { randomUUID } from 'node:crypto';
import { DomainEvents } from '../src/common/domain-events';
import { TransitAnalyzerController } from '../src/crm/transitanalyzer/transit-analyzer.controller';

import { aClient } from './support/client.fixtures';
import { anAddress } from './support/address.fixtures';
import { createTestApplication } from './support/test-application';

const minute = 60000;
type Route = readonly [
  from: number,
  to: number,
  startMinute: number,
  client?: number,
];

describe('Analysis of consecutive transits', () => {
  let application: Awaited<ReturnType<typeof createTestApplication>>;
  beforeAll(async () => {
    application = await createTestApplication();
  });
  afterAll(async () => application.close());

  it.each([
    [
      'longest route',
      [
        [0, 1, 0],
        [1, 2, 15],
        [2, 3, 30],
        [0, 4, 1440],
      ],
      [0, 1, 2, 3],
    ],
    [
      'long stop',
      [
        [0, 1, 0],
        [1, 2, 15],
        [2, 3, 50],
      ],
      [0, 1, 2],
    ],
    [
      'loop through a previously visited address',
      [
        [0, 1, 0],
        [1, 0, 15],
        [0, 2, 30],
      ],
      [0, 1, 0, 2],
    ],
    [
      'separate clients',
      [
        [0, 1, 0, 0],
        [1, 2, 15, 1],
      ],
      [0, 1],
    ],
    [
      'disconnected route',
      [
        [0, 1, 0],
        [2, 3, 15],
        [3, 4, 30],
      ],
      [0, 1],
    ],
    ['no transits', [], []],
  ] as const)('finds the %s', async (_name, routes, expected) => {
    const fixture = await history(routes);
    const result = await application.run(() =>
      application.app
        .get(TransitAnalyzerController)
        .analyze(fixture.clientId, fixture.startAddressId),
    );
    expect(result.getAddresses().map((address) => address.getName())).toEqual(
      expected.map((index) => `Address ${index}`),
    );
  });

  async function history(routes: readonly Route[]) {
    return application.run(async () => {
      const clients = [aClient(), aClient()];
      const addresses = Array.from({ length: 5 }, (_, index) => {
        const address = anAddress();
        address.setName(`Address ${index}`);
        address.setStreet(`${index}-${address.id}`);
        address.setHash();
        return address;
      });
      application.orm.em.persist([...clients, ...addresses]);
      for (const [from, to, startMinute, owner = 0] of routes) {
        const started = Date.UTC(2021, 0, 1) + startMinute * minute;
        await application.app.get(DomainEvents).publish({
          type: 'transit-completed',
          transitId: randomUUID(),
          clientId: clients[owner].id,
          fromHash: addresses[from].getHash(),
          toHash: addresses[to].getHash(),
          started,
          completeAt: started + 10 * minute,
        });
      }
      await application.orm.em.flush();
      return { clientId: clients[0].id, startAddressId: addresses[0].id };
    });
  }
});
