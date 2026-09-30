import { Injectable } from '@nestjs/common';
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

import { DriverAssignmentFacade } from '../assignment/driver-assignment.facade';

import { TransitDetailsFacade } from './details/transit-details.facade';

import { RideStore } from './ride-store';

@Injectable()
export class CompleteTransitService {
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
  ) {}

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
}
