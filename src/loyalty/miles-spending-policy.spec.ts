import { MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { AwardsAccount } from '../entity/awards-account.entity';
import { Type } from '../entity/client.entity';
import { aClient } from '../../test/support/client.fixtures';
import { aCompletedTransit } from '../../test/support/transit.fixtures';
import { Money } from '../money/money';
import { chooseMilesSpendingPolicy } from './miles-spending-policy';

describe('Miles spending policies', () => {
  let metadata: MikroORM;
  beforeAll(async () => {
    metadata = await MikroORM.init({
      dbName: 'metadata_only',
      metadataProvider: ReflectMetadataProvider,
      entities: [AwardsAccount],
    });
  });
  afterAll(async () => metadata.close());

  it.each([
    ['regular', Type.NORMAL, 0, 0, 4, [0, 14, 0, 0]],
    ['VIP', Type.VIP, 0, 0, 4, [5, 0, 4, 5]],
    ['frequent client', Type.NORMAL, 15, 0, 4, [5, 9, 0, 0]],
    ['frequent client on Sunday', Type.NORMAL, 15, 0, 3, [5, 0, 4, 5]],
    ['frequent claimant overrides VIP', Type.VIP, 15, 3, 3, [0, 14, 0, 0]],
  ] as const)(
    'uses the rule for %s',
    (_name, clientType, transitCount, claimCount, day, expected) => {
      const moment = new Date(2021, 0, day, 12).getTime();
      const account = new AwardsAccount(aClient(), 0);
      account.activate();
      const transit = aCompletedTransit(Money.fromMajor(80));
      const grants = [
        account.addNonExpiringMiles(5, 1),
        account.addExpiringMiles(15, moment + 100, transit.id, 4)!,
        account.addExpiringMiles(10, moment + 200, transit.id, 3)!,
        account.addExpiringMiles(5, moment + 300, transit.id, 2)!,
      ];
      account.remove(
        21,
        moment,
        chooseMilesSpendingPolicy({
          clientType,
          transitCount,
          claimCount,
          moment,
        }),
      );
      expect(grants.map((grant) => grant.getMilesAmount(moment))).toEqual(
        expected,
      );
    },
  );
});
