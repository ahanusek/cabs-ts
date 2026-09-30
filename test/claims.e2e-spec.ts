import { AwardsService } from '../src/loyalty/awards.service';
import { Type } from '../src/crm/client.entity';
import { TransitDetails } from '../src/transitdetails/transit-details.entity';
import { transitSnapshot } from '../src/transitdetails/transit-snapshot';
import { Claim, ClaimStatus } from '../src/crm/claims/claim.entity';
import { ClaimService } from '../src/crm/claims/claim.service';
import { Money } from '../src/money/money';
import { createTestApplication } from './support/test-application';
import { aCompletedTransit } from './support/transit.fixtures';

describe('Automatic claims resolution', () => {
  let fixture: Awaited<ReturnType<typeof createTestApplication>>;
  beforeAll(async () => {
    fixture = await createTestApplication();
  });
  afterAll(() => fixture?.close());

  it('refunds and persists the first claim', async () => {
    const claim = await aClaim();
    await fixture.orm.em.fork().persist(claim).flush();
    await fixture.run(() =>
      fixture.app.get(ClaimService).tryToResolveAutomatically(claim.id),
    );
    const loaded = await fixture.orm.em.fork().findOneOrFail(Claim, claim.id);
    expect(loaded.getStatus()).toBe(ClaimStatus.REFUNDED);
  });

  it('escalates a repeated claim for the same transit', async () => {
    const first = await aClaim();
    const second = await aClaim();
    second.setOwner(first.clientId, first.clientType);
    second.setTransitId(first.transitId);
    await fixture.orm.em.fork().persist([first, second]).flush();
    const result = await fixture.run(() =>
      fixture.app.get(ClaimService).tryToResolveAutomatically(second.id),
    );
    expect(result.getStatus()).toBe(ClaimStatus.ESCALATED);
  });

  it('grants VIP refund miles through the loyalty subscriber', async () => {
    const claim = await aClaim(Type.VIP);
    await fixture.orm.em.fork().persist(claim).flush();
    await fixture.run(async () => {
      const awards = fixture.app.get(AwardsService);
      await awards.registerToProgram(claim.clientId);
      await fixture.app.get(ClaimService).tryToResolveAutomatically(claim.id);
      expect(await awards.calculateBalance(claim.clientId)).toBe(10);
    });
  });

  async function aClaim(type = Type.NORMAL): Promise<Claim> {
    const transit = aCompletedTransit(new Money(4400));
    transit.getClient().setType(type);
    transit.getClient().setType(type);
    await fixture.orm.em
      .fork()
      .persist([transit, new TransitDetails(transitSnapshot(transit))])
      .flush();
    const claim = new Claim();
    claim.setTransitId(transit.id);
    claim.setOwner(transit.getClient().id, transit.getClient().getType());
    claim.setReason('Incorrect route');
    claim.setStatus(ClaimStatus.NEW);
    claim.setClaimNo(claim.id);
    claim.setCreationDate(Date.now());
    return claim;
  }
});
