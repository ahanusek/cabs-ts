import type { DocumentHeader } from '../model/document-header.entity';
import type { ContentId } from '../model/document-values';

export interface StateChange {
  desiredState: string;
  verifierId?: string;
}

export interface DocumentEvent {
  type: 'document-published' | 'document-unpublished';
  documentId: string;
  contentId: string | null;
}

export interface TransitionOutcome {
  accepted: boolean;
  events: DocumentEvent[];
}

export interface DocumentWorkflow {
  changeState(header: DocumentHeader, command: StateChange): TransitionOutcome;
  changeContent(header: DocumentHeader, contentId: ContentId): boolean;
}
