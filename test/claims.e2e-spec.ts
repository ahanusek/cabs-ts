import { Claim, ClaimStatus } from '../src/entity/claim.entity';
import { ClaimService } from '../src/service/claim.service';
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
    const claim = aClaim();
    await fixture.orm.em.fork().persist(claim).flush();
    await fixture.run(() =>
      fixture.app.get(ClaimService).tryToResolveAutomatically(claim.id),
    );
    const loaded = await fixture.orm.em.fork().findOneOrFail(Claim, claim.id);
    expect(loaded.getStatus()).toBe(ClaimStatus.REFUNDED);
  });

  it('escalates a repeated claim for the same transit', async () => {
    const first = aClaim();
    const second = aClaim();
    second.setOwner(first.getOwner());
    second.setTransit(first.getTransit());
    await fixture.orm.em.fork().persist([first, second]).flush();
    const result = await fixture.run(() =>
      fixture.app.get(ClaimService).tryToResolveAutomatically(second.id),
    );
    expect(result.getStatus()).toBe(ClaimStatus.ESCALATED);
  });

  function aClaim(): Claim {
    const transit = aCompletedTransit(new Money(4400));
    const claim = new Claim();
    claim.setTransit(transit);
    claim.setOwner(transit.getClient());
    claim.setReason('Incorrect route');
    claim.setStatus(ClaimStatus.NEW);
    claim.setClaimNo(claim.id);
    claim.setCreationDate(Date.now());
    return claim;
  }
});
