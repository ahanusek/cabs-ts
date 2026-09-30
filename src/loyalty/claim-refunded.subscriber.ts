import {
  Injectable,
  type OnModuleInit,
  type OnModuleDestroy,
} from '@nestjs/common';
import { DomainEvents } from '../common/domain-events';
import { AwardsService } from './awards.service';

interface ClaimRefunded {
  type: 'claim-refunded';
  clientId: string;
  clientType: string;
}

@Injectable()
export class ClaimRefundedSubscriber implements OnModuleInit, OnModuleDestroy {
  private unsubscribe?: () => void;
  constructor(
    private readonly events: DomainEvents,
    private readonly awards: AwardsService,
  ) {}
  public onModuleInit() {
    this.unsubscribe = this.events.subscribe<ClaimRefunded>(
      'claim-refunded',
      async (event) => {
        if (event.clientType === 'vip')
          await this.awards.registerNonExpiringMiles(event.clientId, 10);
      },
    );
  }
  public onModuleDestroy() {
    this.unsubscribe?.();
  }
}
