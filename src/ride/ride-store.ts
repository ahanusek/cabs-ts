import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { LockMode } from '@mikro-orm/core';
import { RequestForTransit } from './request-for-transit.entity';
import { TransitDemand } from './transit-demand.entity';
import { Transit } from './transit.entity';

@Injectable()
export class RideStore {
  constructor(private readonly em: EntityManager) {}
  public async request(id: string) {
    const request = await this.em.findOne(RequestForTransit, id, {
      lockMode: LockMode.PESSIMISTIC_WRITE,
    });
    if (!request) throw new NotFoundException(`Request ${id} does not exist`);
    return request;
  }
  public async demand(id: string) {
    const demand = await this.em.findOne(TransitDemand, { requestId: id });
    if (!demand) throw new NotFoundException('Transit has not been published');
    return demand;
  }
  public async transit(id: string) {
    const transit = await this.em.findOne(Transit, { requestId: id });
    if (!transit) throw new NotFoundException('Transit has not been started');
    return transit;
  }
}
