import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Claim } from './claim.entity';

@Injectable()
export class ClaimsQueries {
  constructor(private readonly em: EntityManager) {}
  public countByClient(clientId: string) {
    return this.em.count(Claim, { clientId });
  }
}
