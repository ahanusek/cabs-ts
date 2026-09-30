import { NotAcceptableException } from '@nestjs/common';
import { AwardsService } from '../src/service/awards.service';
import { AwardedMiles } from '../src/entity/awarded-miles.entity';
import { Money } from '../src/money/money';
import { aClient, aCompletedTransit } from './support/fixtures';
import { createTestApplication } from './support/test-application';

describe('Awards account — legacy behavior', () => {
  let application: Awaited<ReturnType<typeof createTestApplication>>;
  let awards: AwardsService;
  let clientId: string;
  let transitId: string;

  beforeAll(async () => {
    application = await createTestApplication();
    awards = application.app.get(AwardsService);
  });
  afterAll(async () => application.close());
  beforeEach(async () => {
    await application.run(async () => {
      const transit = aCompletedTransit(Money.fromMajor(80));
      clientId = transit.getClient().id;
      transitId = transit.id;
      await application.orm.em.persist(transit).flush();
      await awards.registerToProgram(clientId);
    });
  });

  it('registers an inactive account without transactions', async () => {
    const account = await application.run(() => awards.findBy(clientId));
    expect([account.getActive(), account.getTransactions()]).toEqual([
      false,
      0,
    ]);
  });

  it('persists activation between requests', async () => {
    await application.run(() => awards.activateAccount(clientId));
    const account = await application.run(() => awards.findBy(clientId));
    expect(account.getActive()).toBe(true);
  });

  it('does not grant transit miles to an inactive account', async () => {
    await application.run(() => awards.registerMiles(clientId, transitId));
    expect(await balance()).toBe(0);
  });

  it('counts grants and combines regular and special miles', async () => {
    await application.run(async () => {
      await awards.activateAccount(clientId);
      await awards.registerMiles(clientId, transitId);
      await awards.registerSpecialMiles(clientId, 20);
    });
    const account = await application.run(() => awards.findBy(clientId));
    expect([account.getTransactions(), await balance()]).toEqual([2, 30]);
  });

  it('excludes expired miles from the balance', async () => {
    await application.run(async () => {
      await awards.activateAccount(clientId);
      const miles = await awards.registerMiles(clientId, transitId);
      miles!.setExpirationDate(Date.now() - 1000);
      await application.orm.em.flush();
      await awards.registerSpecialMiles(clientId, 20);
    });
    expect(await balance()).toBe(20);
  });

  it('removes miles across multiple grants', async () => {
    await grantThirtyMiles();
    await application.run(() => awards.removeMiles(clientId, 21));
    expect(await balance()).toBe(9);
  });

  it('rejects spending more than the available balance', async () => {
    await grantThirtyMiles();
    await expect(
      application.run(() => awards.removeMiles(clientId, 31)),
    ).rejects.toBeInstanceOf(NotAcceptableException);
  });

  it('transfers a complete grant between accounts', async () => {
    const destination = await anotherAccount();
    await application.run(async () => {
      await awards.activateAccount(clientId);
      await awards.registerSpecialMiles(clientId, 10);
      await awards.transferMiles(clientId, destination, 10);
    });
    expect([await balance(), await balance(destination)]).toEqual([0, 10]);
  });

  it('leaves the balance unchanged when transferring from an inactive account', async () => {
    const destination = await anotherAccount();
    await application.run(async () => {
      await awards.registerSpecialMiles(clientId, 10);
      await awards.transferMiles(clientId, destination, 5);
    });
    expect([await balance(), await balance(destination)]).toEqual([10, 0]);
  });

  it('keeps non-expiring grants after regular grants expire', async () => {
    await application.run(async () => {
      await awards.registerSpecialMiles(clientId, 20);
      application.orm.em.clear();
      const grants = await application.orm.em.find(AwardedMiles, {
        client: clientId,
      });
      grants[0].setDate(Date.UTC(1989, 11, 12));
      await application.orm.em.flush();
    });
    expect(await balance()).toBe(20);
  });

  async function grantThirtyMiles() {
    await application.run(async () => {
      await awards.activateAccount(clientId);
      for (let grant = 0; grant < 3; grant++) {
        await awards.registerMiles(clientId, transitId);
      }
    });
  }

  async function anotherAccount() {
    return application.run(async () => {
      const client = aClient();
      await application.orm.em.persist(client).flush();
      await awards.registerToProgram(client.id);
      await awards.activateAccount(client.id);
      return client.id;
    });
  }

  function balance(id = clientId) {
    return application.run(() => awards.calculateBalance(id));
  }
});
