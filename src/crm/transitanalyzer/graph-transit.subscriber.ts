import {
  Injectable,
  type OnModuleInit,
  type OnModuleDestroy,
} from '@nestjs/common';
import { DomainEvents, type DomainEvent } from '../../common/domain-events';
import { GraphTransitAnalyzer } from './graph-transit-analyzer';
import type { TransitCompleted } from './transit-completed';

@Injectable()
export class GraphTransitSubscriber implements OnModuleInit, OnModuleDestroy {
  private unsubscribe?: () => void;
  constructor(
    private readonly events: DomainEvents,
    private readonly graph: GraphTransitAnalyzer,
  ) {}

  public onModuleInit(): void {
    this.unsubscribe = this.events.subscribe<TransitCompleted & DomainEvent>(
      'transit-completed',
      (event) => this.graph.addTransitBetweenAddresses(event),
    );
  }

  public onModuleDestroy(): void {
    this.unsubscribe?.();
  }
}
