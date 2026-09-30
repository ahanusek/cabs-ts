import { ChangeDestinationService } from './change-destination.service';
import { ChangePickupService } from './change-pickup.service';
import { RequestTransitService } from './request-transit.service';
import { Injectable, ForbiddenException } from '@nestjs/common';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { EntityManager } from '@mikro-orm/postgresql';
import { DomainEvents } from '../common/domain-events';

import { AwardsService } from '../loyalty/awards.service';
import { DriverService } from '../driverfleet/driver.service';
import { DriverFeeService } from '../driverfleet/driver-fee.service';
import { InvoiceGenerator } from '../invoicing/invoice-generator.service';
import { RouteService } from '../geolocation/route.service';
import { AddressDto } from '../geolocation/address/address.dto';
import { Address } from '../geolocation/address/address.entity';
import { CarClass } from '../carfleet/car-type.entity';
import { DriverAssignmentFacade } from '../assignment/driver-assignment.facade';
import {
  AssignmentStatus,
  DriverAssignment,
} from '../assignment/driver-assignment.entity';
import { Tariff } from '../pricing/tariff';
import { CreateTransitDto } from './create-transit.dto';
import { TransitDetailsFacade } from './details/transit-details.facade';
import { Status } from './details/status';

import { TransitDemand } from './transit-demand.entity';
import { Transit } from './transit.entity';
import { RideStore } from './ride-store';

@Injectable()
export class TransitService {
  constructor(
    private readonly drivers: DriverService,
    private readonly awards: AwardsService,
    private readonly fees: DriverFeeService,
    private readonly routes: RouteService,
    private readonly invoices: InvoiceGenerator,
    private readonly assignments: DriverAssignmentFacade,
    private readonly em: EntityManager,
    private readonly events: DomainEvents,
    private readonly details: TransitDetailsFacade,
    private readonly store: RideStore,
    private readonly requests: RequestTransitService,
    private readonly pickups: ChangePickupService,
    private readonly destinations: ChangeDestinationService,
  ) {}
  public createTransit(dto: CreateTransitDto) {
    return this.requests.createTransit(dto);
  }

  public _createTransit(
    clientId: string,
    from: Address,
    to: Address,
    carClass: CarClass,
  ) {
    return this.requests._createTransit(clientId, from, to, carClass);
  }
  public _changeTransitAddressFrom(id: string, address: Address) {
    return this.pickups._changeTransitAddressFrom(id, address);
  }

  public changeTransitAddressFrom(id: string, address: AddressDto) {
    return this.pickups.changeTransitAddressFrom(id, address);
  }
  public changeTransitAddressTo(id: string, address: AddressDto) {
    return this.destinations.changeTransitAddressTo(id, address);
  }

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

  @Transactional()
  public async rejectTransit(driverId: string, id: string) {
    await this.store.request(id);
    await this.assignments.reject(id, driverId);
  }

  public completeTransitFromDto(
    driverId: string,
    id: string,
    destination: AddressDto,
  ) {
    return this.completeTransit(driverId, id, destination.toAddressEntity());
  }

  @Transactional()
  public async completeTransit(
    driverId: string,
    id: string,
    destination: Address,
  ) {
    await this.store.request(id);
    await this.assignments.requireAssigned(id, driverId);
    const transit = await this.store.transit(id);
    const details = await this.details.find(id);
    const address = await this.routes.save(destination);
    const distance = this.routes.distance(
      await this.routes.find(details.fromAddressId),
      address,
    );
    const price = transit.complete(distance);
    const fee = await this.fees.calculateDriverFee(driverId, price);
    const now = Date.now();
    await this.drivers.release(driverId);
    await this.details.completed(id, now, price, fee, address, distance);
    await this.awards.registerMiles(details.clientId, id);
    await this.invoices.generate(
      price.toMajor(),
      `${details.view.clientDto.name} ${details.view.clientDto.lastName}`,
    );
    await this.em.flush();
    await this.events.publish({
      type: 'transit-completed',
      transitId: id,
      clientId: details.clientId,
      fromHash: details.fromHash,
      toHash: address.getHash(),
      started: details.view.started!,
      completeAt: now,
    });
  }

  public loadTransit(id: string) {
    return this.details.getView(id);
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
