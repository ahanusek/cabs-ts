import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { DocumentContent } from '../model/document-content.entity';
import { ContentId, ContentVersion } from '../model/document-values';

export interface ContentDraft {
  previousId: ContentId | null;
  version: ContentVersion;
  text: string;
}

@Injectable()
export class DocumentEditor {
  constructor(private readonly em: EntityManager) {}

  public async commit(draft: ContentDraft): Promise<ContentId> {
    if (draft.previousId) await this.get(draft.previousId);
    const content = new DocumentContent(
      draft.version,
      draft.text,
      draft.previousId,
    );
    await this.em.persist(content).flush();
    return content.getContentId();
  }

  public async get(id: ContentId): Promise<ContentDraft & { id: ContentId }> {
    const content = await this.em.findOne(DocumentContent, {
      id: id.asString(),
    });
    if (!content)
      throw new NotFoundException('Document content does not exist');
    return {
      id: content.getContentId(),
      previousId: content.getPreviousId(),
      version: content.getVersion(),
      text: content.getContent(),
    };
  }
}
