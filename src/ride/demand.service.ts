import { Injectable, ForbiddenException } from '@nestjs/common';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { EntityManager } from '@mikro-orm/postgresql';

import { DriverService } from '../driverfleet/driver.service';

import { RouteService } from '../geolocation/route.service';

import { CarClass } from '../carfleet/car-type.entity';
import { DriverAssignmentFacade } from '../assignment/driver-assignment.facade';
import {
  AssignmentStatus,
  DriverAssignment,
} from '../assignment/driver-assignment.entity';

import { TransitDetailsFacade } from './details/transit-details.facade';
import { Status } from './details/status';
import { TransitDemand } from './transit-demand.entity';
import { RideStore } from './ride-store';

@Injectable()
export class DemandService {
  constructor(
    private readonly drivers: DriverService,
    private readonly routes: RouteService,
    private readonly assignments: DriverAssignmentFacade,
    private readonly em: EntityManager,
    private readonly details: TransitDetailsFacade,
    private readonly store: RideStore,
  ) {}

  @Transactional()
  public async cancelTransit(id: string) {
    await this.store.request(id);
    const details = await this.details.find(id);
    if (details.status !== Status.DRAFT) {
      (await this.store.demand(id)).cancel();
      await this.assignments.cancel(id);
    }
    await this.details.cancelled(id);
    await this.em.flush();
  }

  @Transactional()
  public async publishTransit(id: string) {
    await this.store.request(id);
    const details = await this.details.find(id);
    if (details.status !== Status.DRAFT)
      throw new ForbiddenException('Transit has already been published');
    const now = Date.now();
    this.em.persist(new TransitDemand(id));
    await this.details.published(id, now);
    const assignment = await this.assignments.create(
      id,
      await this.routes.find(details.fromAddressId),
      details.view.carClass as CarClass,
      now,
    );
    await this.updateInvolvedDrivers(assignment);
    return this.details.getView(id);
  }

  @Transactional()
  public async findDriversForTransit(id: string) {
    await this.store.request(id);
    const details = await this.details.find(id);
    const assignment = await this.assignments.search(
      id,
      await this.routes.find(details.fromAddressId),
      details.view.carClass as CarClass,
    );
    await this.updateInvolvedDrivers(assignment);
    return this.details.getView(id);
  }

  @Transactional()
  public async acceptTransit(driverId: string, id: string) {
    await this.store.request(id);
    (await this.store.demand(id)).accept();
    await this.assignments.accept(id, driverId);
    await this.details.accepted(id, driverId, Date.now());
  }

  @Transactional()
  public async rejectTransit(driverId: string, id: string) {
    await this.store.request(id);
    await this.assignments.reject(id, driverId);
  }

  private async updateInvolvedDrivers(assignment: DriverAssignment) {
    await this.details.driversProposed(
      assignment.requestId,
      await this.drivers.loadDrivers(assignment.getProposedDrivers()),
    );
    if (assignment.getStatus() === AssignmentStatus.FAILED)
      await this.details.assignmentFailed(assignment.requestId);
  }
}
