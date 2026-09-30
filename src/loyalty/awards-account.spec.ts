import { MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { AwardsAccount } from '../entity/awards-account.entity';
import { aClient } from '../../test/support/fixtures';

describe('Awards account aggregate', () => {
  let metadata: MikroORM;
  beforeAll(async () => {
    metadata = await MikroORM.init({
      dbName: 'metadata_only',
      metadataProvider: ReflectMetadataProvider,
      entities: [AwardsAccount],
    });
  });
  afterAll(async () => metadata.close());

  it('moves only the requested part across several grants', () => {
    const from = activeAccount();
    const to = activeAccount();
    from.addNonExpiringMiles(20, 1);
    from.addNonExpiringMiles(10, 2);
    from.moveMilesTo(to, 7, 3);
    expect([from.calculateBalance(3), to.calculateBalance(3)]).toEqual([23, 7]);
  });

  it('counts a transfer once on each account', () => {
    const from = activeAccount();
    const to = activeAccount();
    from.addNonExpiringMiles(5, 1);
    from.addNonExpiringMiles(5, 2);
    from.moveMilesTo(to, 7, 3);
    expect([from.getTransactions(), to.getTransactions()]).toEqual([3, 1]);
  });

  it('ignores a transfer to the same account', () => {
    const account = activeAccount();
    account.addNonExpiringMiles(10, 1);
    account.moveMilesTo(account, 5, 2);
    expect([account.calculateBalance(2), account.getTransactions()]).toEqual([
      10, 1,
    ]);
  });

  it('rejects a negative transfer', () => {
    expect(() => activeAccount().moveMilesTo(activeAccount(), -1, 0)).toThrow(
      RangeError,
    );
  });

  function activeAccount(): AwardsAccount {
    const account = new AwardsAccount(aClient(), 0);
    account.activate();
    return account;
  }
});
