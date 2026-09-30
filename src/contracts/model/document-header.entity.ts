import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../../common/base.entity';
import { ContentId, DocumentNumber } from './document-values';

@Entity()
export class DocumentHeader extends BaseEntity {
  @Property({ type: 'uuid' })
  private readonly authorId: string;
  @Property()
  private readonly number: string;
  @Property({ nullable: true, type: 'uuid' })
  private verifierId: string | null = null;
  @Property()
  private stateDescriptor = 'draft';
  @Property({ nullable: true, type: 'uuid' })
  private contentId: string | null = null;

  constructor(authorId: string, number: DocumentNumber) {
    super();
    this.authorId = authorId;
    this.number = number.asString();
  }

  public getAuthorId(): string {
    return this.authorId;
  }
  public getVerifierId(): string | null {
    return this.verifierId;
  }
  public getDocumentNumber(): DocumentNumber {
    return new DocumentNumber(this.number);
  }
  public getState(): string {
    return this.stateDescriptor;
  }
  public getContentId(): ContentId | null {
    return this.contentId ? new ContentId(this.contentId) : null;
  }
  public hasContent(): boolean {
    return this.contentId !== null;
  }
  public changeCurrentContent(contentId: ContentId): void {
    this.contentId = contentId.asString();
  }
  public recordVerifier(verifierId: string): void {
    this.verifierId = verifierId;
  }
  public moveTo(state: string): void {
    this.stateDescriptor = state;
  }
}
