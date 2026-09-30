import { DocumentHeader } from '../model/document-header.entity';
import { ContentId } from '../model/document-values';
import type {
  DocumentWorkflow,
  StateChange,
  DocumentEvent,
} from './document-workflow';

export interface TransitionRule {
  name: string;
  test(header: DocumentHeader, command: StateChange): boolean;
}

export type TransitionAction = (
  header: DocumentHeader,
  command: StateChange,
) => DocumentEvent[];

interface Transition {
  rules: readonly TransitionRule[];
  actions: readonly TransitionAction[];
}

interface StateDefinition {
  contentChangeTarget?: string;
  transitions: Map<string, Transition>;
}

export class StateBuilder {
  private readonly states = new Map<string, StateDefinition>();
  constructor(private readonly initialState: string) {
    this.state(initialState);
  }

  public allowContentChange(from: string, to: string): this {
    this.state(from).contentChangeTarget = to;
    this.state(to);
    return this;
  }

  public transition(
    from: string,
    to: string,
    rules: readonly TransitionRule[] = [],
    actions: readonly TransitionAction[] = [],
  ): this {
    this.state(from).transitions.set(to, {
      rules: [...rules],
      actions: [...actions],
    });
    this.state(to);
    return this;
  }

  public build(): DynamicWorkflow {
    return new DynamicWorkflow(
      this.initialState,
      new Map(
        [...this.states].map(([name, state]) => [
          name,
          { ...state, transitions: new Map(state.transitions) },
        ]),
      ),
    );
  }

  private state(name: string): StateDefinition {
    let state = this.states.get(name);
    if (!state) {
      state = { transitions: new Map() };
      this.states.set(name, state);
    }
    return state;
  }
}

export class DynamicWorkflow implements DocumentWorkflow {
  constructor(
    private readonly initial: string,
    private readonly states: ReadonlyMap<string, StateDefinition>,
  ) {}

  public begin(header: DocumentHeader): void {
    header.moveTo(this.initial);
  }

  public changeState(
    header: DocumentHeader,
    command: StateChange,
  ): { accepted: boolean; events: DocumentEvent[] } {
    if (header.getState() === command.desiredState)
      return { accepted: true, events: [] };
    const transition = this.states
      .get(header.getState())
      ?.transitions.get(command.desiredState);
    if (
      !transition ||
      !transition.rules.every((rule) => rule.test(header, command))
    )
      return { accepted: false, events: [] };
    const events = transition.actions.flatMap((action) =>
      action(header, command),
    );
    header.moveTo(command.desiredState);
    return { accepted: true, events };
  }

  public changeContent(header: DocumentHeader, contentId: ContentId): boolean {
    const next = this.states.get(header.getState())?.contentChangeTarget;
    if (!next) return false;
    header.changeCurrentContent(contentId);
    header.moveTo(next);
    return true;
  }

  public describe(header: DocumentHeader) {
    const state = this.states.get(header.getState());
    return {
      contentEditable: Boolean(state?.contentChangeTarget),
      transitions: Object.fromEntries(
        [...(state?.transitions ?? [])].map(([target, transition]) => [
          target,
          transition.rules.map((rule) => rule.name),
        ]),
      ),
    };
  }
}
