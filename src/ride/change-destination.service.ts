import { Injectable, ForbiddenException } from '@nestjs/common';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { EntityManager } from '@mikro-orm/postgresql';

import { RouteService } from '../geolocation/route.service';
import { AddressDto } from '../geolocation/address/address.dto';

import { DriverAssignmentFacade } from '../assignment/driver-assignment.facade';

import { TransitDetailsFacade } from './details/transit-details.facade';
import { Status } from './details/status';

import { Transit } from './transit.entity';
import { RideStore } from './ride-store';

@Injectable()
export class ChangeDestinationService {
  constructor(
    private readonly routes: RouteService,
    private readonly assignments: DriverAssignmentFacade,
    private readonly em: EntityManager,
    private readonly details: TransitDetailsFacade,
    private readonly store: RideStore,
  ) {}

  @Transactional()
  public async changeTransitAddressTo(id: string, address: AddressDto) {
    const request = await this.store.request(id);
    const details = await this.details.find(id);
    if ([Status.CANCELLED, Status.COMPLETED].includes(details.status as Status))
      throw new ForbiddenException('Transit is closed');
    const destination = await this.routes.save(address.toAddressEntity());
    const distance = this.routes.distance(
      await this.routes.find(details.fromAddressId),
      destination,
    );
    const transit = await this.em.findOne(Transit, { requestId: id });
    transit?.changeDestination(distance);
    await this.details.destinationChanged(
      id,
      destination,
      distance,
      request.getTariff().calculateCost(distance),
    );
    await this.assignments.notifyDestinationChanged(id);
    await this.em.flush();
  }
}
