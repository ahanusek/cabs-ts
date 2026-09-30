import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { DocumentHeader } from '../model/document-header.entity';
import { DocumentContent } from '../model/document-content.entity';
import { ContentId, DocumentNumber } from '../model/document-values';
import type { DocumentWorkflow, StateChange } from '../state/document-workflow';
import { StraightforwardWorkflow } from '../state/straightforward-workflow';
import { createAcmeWorkflow } from '../state/acme-workflow';
import { DocumentEvents } from './document-events';

export interface DocumentOperationResult {
  accepted: boolean;
  documentId: string;
  number: string;
  state: string;
  contentId: string | null;
}

class DocumentProcess {
  constructor(
    protected readonly em: EntityManager,
    private readonly workflow: DocumentWorkflow,
    private readonly events: DocumentEvents,
  ) {}

  public async createDocument(
    authorId: string,
  ): Promise<DocumentOperationResult> {
    const header = new DocumentHeader(
      authorId,
      new DocumentNumber(`DOC/${randomUUID()}`),
    );
    await this.em.persist(header).flush();
    return this.result(header, true);
  }

  public async changeState(
    documentId: string,
    command: StateChange,
  ): Promise<DocumentOperationResult> {
    const completed = await this.em.transactional(async (em) => {
      const header = await this.load(em, documentId);
      const outcome = this.workflow.changeState(header, command);
      await em.flush();
      return {
        result: this.result(header, outcome.accepted),
        events: outcome.events,
      };
    });
    completed.events.forEach((event) => this.events.publish(event));
    return completed.result;
  }

  public async changeContent(
    documentId: string,
    contentId: ContentId,
  ): Promise<DocumentOperationResult> {
    return this.em.transactional(async (em) => {
      const content = await em.findOne(DocumentContent, {
        id: contentId.asString(),
      });
      if (!content)
        throw new NotFoundException('Document content does not exist');
      const header = await this.load(em, documentId);
      const accepted = this.workflow.changeContent(header, contentId);
      await em.flush();
      return this.result(header, accepted);
    });
  }

  protected async load(em: EntityManager, id: string): Promise<DocumentHeader> {
    const header = await em.findOne(DocumentHeader, { id });
    if (!header) throw new NotFoundException('Document does not exist');
    return header;
  }

  private result(
    header: DocumentHeader,
    accepted: boolean,
  ): DocumentOperationResult {
    return {
      accepted,
      documentId: header.id,
      number: header.getDocumentNumber().asString(),
      state: header.getState(),
      contentId: header.getContentId()?.asString() ?? null,
    };
  }
}

@Injectable()
export class StraightforwardDocumentProcess extends DocumentProcess {
  constructor(em: EntityManager, events: DocumentEvents) {
    super(em, new StraightforwardWorkflow(), events);
  }
}

@Injectable()
export class DocumentResourceManager extends DocumentProcess {
  constructor(em: EntityManager, events: DocumentEvents) {
    super(em, createAcmeWorkflow(), events);
  }

  public async describe(documentId: string) {
    return createAcmeWorkflow().describe(await this.load(this.em, documentId));
  }
}
