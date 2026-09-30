import { MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Contract, ContractStatus } from './contract.entity';
import { ContractAttachmentStatus } from './contract-attachment.entity';

describe('Contract aggregate without attachment payloads', () => {
  let metadata: MikroORM;
  beforeAll(async () => {
    metadata = await MikroORM.init({
      dbName: 'metadata_only',
      metadataProvider: ReflectMetadataProvider,
      entities: [Contract],
    });
  });
  afterAll(async () => metadata.close());

  it('can accept a contract without attachments', () => {
    const contract = draft();
    contract.accept(100);
    expect([contract.getStatus(), contract.getAcceptedAt()]).toEqual([
      ContractStatus.ACCEPTED,
      100,
    ]);
  });

  it('requires both parties to accept each attachment', () => {
    const contract = draft();
    const attachment = contract.proposeAttachment();
    contract.acceptAttachment(attachment.id, 100);
    expect(() => contract.accept(101)).toThrow('Not all attachments');
  });

  it('accepts after both approvals', () => {
    const contract = draft();
    const attachment = contract.proposeAttachment();
    contract.acceptAttachment(attachment.id, 100);
    contract.acceptAttachment(attachment.id, 101);
    contract.accept(102);
    expect(contract.getStatus()).toBe(ContractStatus.ACCEPTED);
  });

  it('rejects an unknown attachment', () => {
    expect(() => draft().acceptAttachment('unknown', 100)).toThrow(
      'does not belong',
    );
  });

  it('removes only the requested attachment', () => {
    const contract = draft();
    const first = contract.proposeAttachment();
    const second = contract.proposeAttachment();
    contract.removeAttachment(first.id);
    expect(contract.getAttachmentIds()).toEqual([second.id]);
  });

  it('records rejection of an attachment', () => {
    const contract = draft();
    const attachment = contract.proposeAttachment();
    contract.rejectAttachment(attachment.id, 100);
    expect(attachment.getStatus()).toBe(ContractAttachmentStatus.REJECTED);
  });

  function draft() {
    return new Contract('Partner', 'Agreement', 'C/1/Partner');
  }
});
