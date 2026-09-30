import { Injectable, ForbiddenException } from '@nestjs/common';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { EntityManager } from '@mikro-orm/postgresql';

import { DriverAssignmentFacade } from '../assignment/driver-assignment.facade';

import { Tariff } from '../pricing/tariff';

import { TransitDetailsFacade } from './details/transit-details.facade';
import { Status } from './details/status';

import { Transit } from './transit.entity';
import { RideStore } from './ride-store';

@Injectable()
export class StartTransitService {
  constructor(
    private readonly assignments: DriverAssignmentFacade,
    private readonly em: EntityManager,
    private readonly details: TransitDetailsFacade,
    private readonly store: RideStore,
  ) {}

  @Transactional()
  public async startTransit(driverId: string, id: string) {
    await this.store.request(id);
    await this.assignments.requireAssigned(id, driverId);
    if ((await this.details.find(id)).status !== Status.TRANSIT_TO_PASSENGER)
      throw new ForbiddenException('Transit cannot be started');
    const now = Date.now();
    const tariff = Tariff.ofTime(new Date(now));
    this.em.persist(new Transit(id, tariff));
    await this.details.started(id, now, tariff);
    await this.em.flush();
  }
}
