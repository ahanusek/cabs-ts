import type {
  DocumentWorkflow,
  StateChange,
  TransitionOutcome,
} from './document-workflow';
import { DocumentHeader } from '../model/document-header.entity';
import { ContentId } from '../model/document-values';

abstract class StatePolicy {
  public abstract canEnter(
    header: DocumentHeader,
    command: StateChange,
  ): boolean;
  public abstract afterContentChange(): string | null;
  public enter(_header: DocumentHeader, _command: StateChange): void {}
}

class DraftState extends StatePolicy {
  public canEnter(): boolean {
    return true;
  }
  public afterContentChange(): string {
    return 'draft';
  }
}

class VerifiedState extends StatePolicy {
  public canEnter(header: DocumentHeader, command: StateChange): boolean {
    return (
      header.getState() === 'draft' &&
      header.hasContent() &&
      Boolean(command.verifierId) &&
      command.verifierId !== header.getAuthorId()
    );
  }
  public afterContentChange(): string {
    return 'draft';
  }
  public override enter(header: DocumentHeader, command: StateChange): void {
    header.recordVerifier(command.verifierId!);
  }
}

class PublishedState extends StatePolicy {
  public canEnter(header: DocumentHeader): boolean {
    return header.getState() === 'verified' && header.hasContent();
  }
  public afterContentChange(): null {
    return null;
  }
}

class ArchivedState extends StatePolicy {
  public canEnter(): boolean {
    return true;
  }
  public afterContentChange(): null {
    return null;
  }
}

export class StraightforwardWorkflow implements DocumentWorkflow {
  private readonly states: ReadonlyMap<string, StatePolicy> = new Map<
    string,
    StatePolicy
  >([
    ['draft', new DraftState()],
    ['verified', new VerifiedState()],
    ['published', new PublishedState()],
    ['archived', new ArchivedState()],
  ]);

  public changeState(
    header: DocumentHeader,
    command: StateChange,
  ): TransitionOutcome {
    if (header.getState() === command.desiredState)
      return { accepted: true, events: [] };
    const state = this.states.get(command.desiredState);
    if (!state?.canEnter(header, command))
      return { accepted: false, events: [] };
    state.enter(header, command);
    header.moveTo(command.desiredState);
    return { accepted: true, events: [] };
  }

  public changeContent(header: DocumentHeader, contentId: ContentId): boolean {
    const next = this.states.get(header.getState())?.afterContentChange();
    if (!next) return false;
    header.changeCurrentContent(contentId);
    header.moveTo(next);
    return true;
  }
}
