import { PartyId } from '../src/party/party-id';
import { Parts } from '../src/repair/parts';
import { RepairContractManager } from '../src/repair/repair-contract.manager';
import { RepairProcess } from '../src/repair/repair-process';
import { Money } from '../src/money/money';
import { createTestApplication } from './support/test-application';

const allParts = new Set(Object.values(Parts));

describe('Repair roles assigned through party relationships', () => {
  let application: Awaited<ReturnType<typeof createTestApplication>>;
  beforeAll(async () => {
    application = await createTestApplication();
  });
  afterAll(async () => application.close());

  it('resolves a manufacturer warranty after reloading the relationship', async () => {
    const vehicle = new PartyId();
    const guarantor = new PartyId();
    await application.run(() =>
      application.app
        .get(RepairContractManager)
        .manufacturerWarrantyRegistered(guarantor, vehicle),
    );
    const result = await application.run(() =>
      application.app.get(RepairProcess).resolve({ vehicle, parts: allParts }),
    );
    expect(result).toEqual({
      status: 'success',
      handlingParty: guarantor.asString(),
      totalCost: Money.ZERO,
      acceptedParts: allParts,
    });
  });

  it('excludes paint under extended insurance', async () => {
    const vehicle = new PartyId();
    const insurer = new PartyId();
    await application.run(() =>
      application.app
        .get(RepairContractManager)
        .extendedWarrantyContractSigned(insurer, vehicle),
    );
    const result = await application.run(() =>
      application.app.get(RepairProcess).resolve({ vehicle, parts: allParts }),
    );
    expect(result).toEqual({
      status: 'success',
      handlingParty: insurer.asString(),
      totalCost: Money.ZERO,
      acceptedParts: new Set([Parts.ENGINE, Parts.GEARBOX, Parts.SUSPENSION]),
    });
  });

  it('returns an error for a vehicle without a responsible party', async () => {
    expect(
      await application.run(() =>
        application.app
          .get(RepairProcess)
          .resolve({ vehicle: new PartyId(), parts: allParts }),
      ),
    ).toEqual({ status: 'error' });
  });
});
