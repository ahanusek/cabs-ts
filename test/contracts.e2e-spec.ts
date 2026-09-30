import { randomUUID } from 'node:crypto';
import { NotAcceptableException } from '@nestjs/common';
import { ContractService } from '../src/service/contract.service';
import { ContractStatus } from '../src/entity/contract.entity';
import { ContractAttachmentStatus } from '../src/entity/contract-attachment.entity';
import { createTestApplication } from './support/test-application';

describe('Contract lifecycle', () => {
  let application: Awaited<ReturnType<typeof createTestApplication>>;
  let contracts: ContractService;
  let contractId: string;

  beforeAll(async () => {
    application = await createTestApplication();
    contracts = application.app.get(ContractService);
  });
  afterAll(async () => application.close());
  beforeEach(async () => {
    contractId = await application.run(async () => {
      const contract = await contracts.createContract({
        partnerName: randomUUID(),
        subject: 'Price agreement',
      });
      return contract.id;
    });
  });

  it('starts negotiations for a newly created contract', async () => {
    expect((await load()).getStatus()).toBe(
      ContractStatus.NEGOTIATIONS_IN_PROGRESS,
    );
  });

  it('numbers contracts separately for each partner', async () => {
    const partnerName = randomUUID();
    const numbers = await application.run(async () => {
      const first = await contracts.createContract({
        partnerName,
        subject: 'First',
      });
      const second = await contracts.createContract({
        partnerName,
        subject: 'Second',
      });
      return [first.getContractNo(), second.getContractNo()];
    });
    expect(numbers).toEqual([`C/1/${partnerName}`, `C/2/${partnerName}`]);
  });

  it('preserves binary attachment content between requests', async () => {
    await addAttachment();
    expect((await load()).getAttachments()[0].getData()).toBe('content');
  });

  it.each([
    [1, ContractAttachmentStatus.ACCEPTED_BY_ONE_SIDE],
    [2, ContractAttachmentStatus.ACCEPTED_BY_BOTH_SIDES],
    [3, ContractAttachmentStatus.ACCEPTED_BY_BOTH_SIDES],
  ])('records %i attachment acceptances', async (count, status) => {
    const attachment = await addAttachment();
    for (let acceptance = 0; acceptance < count; acceptance++) {
      await application.run(() =>
        contracts.acceptAttachment(attachment.getId()),
      );
    }
    expect((await load()).getAttachments()[0].getStatus()).toBe(status);
  });

  it('rejects an attachment', async () => {
    const attachment = await addAttachment();
    await application.run(() => contracts.rejectAttachment(attachment.getId()));
    expect((await load()).getAttachments()[0].getStatus()).toBe(
      ContractAttachmentStatus.REJECTED,
    );
  });

  it('accepts a contract with all attachments agreed', async () => {
    const attachment = await addAttachment();
    await application.run(async () => {
      await contracts.acceptAttachment(attachment.getId());
      await contracts.acceptAttachment(attachment.getId());
      await contracts.acceptContract(contractId);
    });
    expect((await load()).getStatus()).toBe(ContractStatus.ACCEPTED);
  });

  it('rejects accepting a contract with a proposed attachment', async () => {
    await addAttachment();
    await expect(
      application.run(() => contracts.acceptContract(contractId)),
    ).rejects.toBeInstanceOf(NotAcceptableException);
  });

  it('removes an attachment', async () => {
    const attachment = await addAttachment();
    await application.run(() =>
      contracts.removeAttachment(contractId, attachment.getId()),
    );
    expect((await load()).getAttachments()).toHaveLength(0);
  });

  it('rejects a contract', async () => {
    await application.run(() => contracts.rejectContract(contractId));
    expect((await load()).getStatus()).toBe(ContractStatus.REJECTED);
  });

  function addAttachment() {
    return application.run(() =>
      contracts.proposeAttachment(contractId, {
        data: Buffer.from('content').toString('base64'),
      }),
    );
  }

  function load() {
    return application.run(() => contracts.findDto(contractId));
  }
});
