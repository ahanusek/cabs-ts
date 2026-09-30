import { ClaimsResolver, WhoToAsk } from './claims-resolver.entity';
import { Claim, ClaimStatus } from './claim.entity';
import { Type } from '../../entity/client.entity';
import { Money } from '../../money/money';
import { aCompletedTransit } from '../../../test/support/transit.fixtures';

const rules = { vipThreshold: new Money(5000), minimumTransits: 10 };
function aClaim(type = Type.NORMAL) {
  const transit = aCompletedTransit(new Money(4400));
  transit.getClient().setType(type);
  const claim = new Claim();
  claim.setOwner(transit.getClient().id, transit.getClient().getType());
  claim.setTransitId(transit.id);
  return claim;
}

describe('ClaimsResolver', () => {
  it('refunds the first claim', () => {
    expect(
      new ClaimsResolver('client').resolve(
        aClaim(),
        { numberOfTransits: 0, price: new Money(4400) },
        rules,
      ).status,
    ).toBe(ClaimStatus.REFUNDED);
  });
  it('escalates a duplicate without asking anyone', () => {
    const claim = aClaim();
    const resolver = new ClaimsResolver('client');
    resolver.resolve(
      claim,
      { numberOfTransits: 0, price: new Money(4400) },
      rules,
    );
    expect(
      resolver.resolve(
        claim,
        { numberOfTransits: 0, price: new Money(4400) },
        rules,
      ),
    ).toEqual({
      status: ClaimStatus.ESCALATED,
      whoToAsk: WhoToAsk.NO_ONE,
    });
  });
  it.each([
    [Type.VIP, 4400, 0, ClaimStatus.REFUNDED, WhoToAsk.NO_ONE],
    [Type.VIP, 5000, 0, ClaimStatus.ESCALATED, WhoToAsk.DRIVER],
    [Type.NORMAL, 4400, 10, ClaimStatus.REFUNDED, WhoToAsk.NO_ONE],
    [Type.NORMAL, 5000, 10, ClaimStatus.ESCALATED, WhoToAsk.CLIENT],
    [Type.NORMAL, 4400, 9, ClaimStatus.ESCALATED, WhoToAsk.DRIVER],
  ])(
    'resolves an established client claim according to their history',
    (type, price, count, status, whoToAsk) => {
      const resolver = new ClaimsResolver('client', ['one', 'two', 'three']);
      expect(
        resolver.resolve(
          aClaim(type),
          { numberOfTransits: count, price: new Money(price) },
          rules,
        ),
      ).toEqual({
        status,
        whoToAsk,
      });
    },
  );
});
