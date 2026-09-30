import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../../common/base.entity';
import { ContentId, ContentVersion } from './document-values';

@Entity()
export class DocumentContent extends BaseEntity {
  @Property({ type: 'uuid', nullable: true })
  private readonly previousId: string | null;
  @Property({ type: 'text' })
  private readonly physicalContent: string;
  @Property()
  private readonly version: string;

  constructor(
    version: ContentVersion,
    physicalContent: string,
    previousId: ContentId | null = null,
  ) {
    super();
    this.previousId = previousId?.asString() ?? null;
    this.version = version.asString();
    this.physicalContent = physicalContent;
  }

  public getContentId(): ContentId {
    return new ContentId(this.id);
  }
  public getPreviousId(): ContentId | null {
    return this.previousId ? new ContentId(this.previousId) : null;
  }
  public getVersion(): ContentVersion {
    return new ContentVersion(this.version);
  }
  public getContent(): string {
    return this.physicalContent;
  }
}
