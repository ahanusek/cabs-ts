import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { TransitDetails } from './transit-details.entity';
import type { TransitSnapshot } from './transit-details.entity';

@Injectable()
export class TransitDetailsFacade {
  constructor(private readonly em: EntityManager) {}

  public async record(snapshot: TransitSnapshot): Promise<void> {
    await this.em.upsert(TransitDetails, new TransitDetails(snapshot));
  }

  public async find(transitId: string): Promise<TransitDetails> {
    const details = await this.em.findOne(TransitDetails, { transitId });
    if (!details)
      throw new NotFoundException(`Transit ${transitId} does not exist`);
    return details;
  }

  public async getView(transitId: string) {
    return structuredClone((await this.find(transitId)).view);
  }

  public countByClient(clientId: string) {
    return this.em.count(TransitDetails, { clientId });
  }
}
