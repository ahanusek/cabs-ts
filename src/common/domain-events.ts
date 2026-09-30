import { Injectable } from '@nestjs/common';

export interface DomainEvent {
  readonly type: string;
}
type EventHandler = (event: DomainEvent) => Promise<void>;

@Injectable()
export class DomainEvents {
  private readonly handlers = new Map<string, Set<EventHandler>>();

  public subscribe<T extends DomainEvent>(
    type: T['type'],
    handler: (event: T) => Promise<void>,
  ): () => void {
    const handlers = this.handlers.get(type) ?? new Set<EventHandler>();
    const invoke: EventHandler = (event) => handler(event as T);
    handlers.add(invoke);
    this.handlers.set(type, handlers);
    return () => {
      handlers.delete(invoke);
    };
  }

  public async publish<T extends DomainEvent>(event: T): Promise<void> {
    for (const handler of this.handlers.get(event.type) ?? [])
      await handler(event);
  }
}
