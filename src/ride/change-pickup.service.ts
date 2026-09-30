import { Injectable } from '@nestjs/common';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { EntityManager } from '@mikro-orm/postgresql';

import { RouteService } from '../geolocation/route.service';
import { AddressDto } from '../geolocation/address/address.dto';
import { Address } from '../geolocation/address/address.entity';

import { DriverAssignmentFacade } from '../assignment/driver-assignment.facade';

import { TransitDetailsFacade } from './details/transit-details.facade';

import { RideStore } from './ride-store';

@Injectable()
export class ChangePickupService {
  constructor(
    private readonly routes: RouteService,
    private readonly assignments: DriverAssignmentFacade,
    private readonly em: EntityManager,
    private readonly details: TransitDetailsFacade,
    private readonly store: RideStore,
  ) {}

  @Transactional()
  public async _changeTransitAddressFrom(id: string, address: Address) {
    const request = await this.store.request(id);
    const demand = await this.store.demand(id);
    const details = await this.details.find(id);
    const pickup = await this.routes.save(address);
    const previous = await this.routes.find(details.fromAddressId);
    demand.changePickup(
      this.routes.distanceFromPreviousPickup(previous, pickup),
    );
    const distance = this.routes.distance(
      pickup,
      await this.routes.find(details.toAddressId),
    );
    await this.details.pickupChanged(
      id,
      pickup,
      distance,
      request.getTariff().calculateCost(distance),
    );
    await this.assignments.notifyPickupChanged(id);
    await this.em.flush();
  }

  public changeTransitAddressFrom(id: string, address: AddressDto) {
    return this._changeTransitAddressFrom(id, address.toAddressEntity());
  }
}
