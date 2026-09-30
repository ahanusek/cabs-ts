import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
export class ContractAttachmentData {
  @PrimaryKey({ type: 'uuid' })
  public readonly attachmentId: string;

  @Property({ type: 'blob' })
  private readonly data: Buffer;

  @Property({ type: 'bigint', runtimeType: 'number' })
  private readonly creationDate = Date.now();

  constructor(attachmentId: string, data: Buffer) {
    this.attachmentId = attachmentId;
    this.data = Buffer.from(data);
  }

  public getData(): Buffer {
    return Buffer.from(this.data);
  }
}
