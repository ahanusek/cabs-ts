import { DemandService } from './demand.service';
import { CompleteTransitService } from './complete-transit.service';
import { StartTransitService } from './start-transit.service';
import { ChangeDestinationService } from './change-destination.service';
import { ChangePickupService } from './change-pickup.service';
import { RequestTransitService } from './request-transit.service';
import { Injectable } from '@nestjs/common';

import { AddressDto } from '../geolocation/address/address.dto';
import { Address } from '../geolocation/address/address.entity';
import { CarClass } from '../carfleet/car-type.entity';

import { CreateTransitDto } from './create-transit.dto';
import { TransitDetailsFacade } from './details/transit-details.facade';

@Injectable()
export class RideService {
  constructor(
    private readonly details: TransitDetailsFacade,
    private readonly requests: RequestTransitService,
    private readonly pickups: ChangePickupService,
    private readonly destinations: ChangeDestinationService,
    private readonly starts: StartTransitService,
    private readonly completions: CompleteTransitService,
    private readonly demands: DemandService,
  ) {}
  public createTransit(dto: CreateTransitDto) {
    return this.requests.createTransit(dto);
  }

  public createTransitFromAddresses(
    clientId: string,
    from: Address,
    to: Address,
    carClass: CarClass,
  ) {
    return this.requests.createTransitFromAddresses(
      clientId,
      from,
      to,
      carClass,
    );
  }
  public changePickup(id: string, address: Address) {
    return this.pickups.changePickup(id, address);
  }

  public changeTransitAddressFrom(id: string, address: AddressDto) {
    return this.pickups.changeTransitAddressFrom(id, address);
  }
  public changeTransitAddressTo(id: string, address: AddressDto) {
    return this.destinations.changeTransitAddressTo(id, address);
  }
  public cancelTransit(id: string) {
    return this.demands.cancelTransit(id);
  }

  public publishTransit(id: string) {
    return this.demands.publishTransit(id);
  }

  public findDriversForTransit(id: string) {
    return this.demands.findDriversForTransit(id);
  }

  public acceptTransit(driverId: string, id: string) {
    return this.demands.acceptTransit(driverId, id);
  }

  public startTransit(driverId: string, id: string) {
    return this.starts.startTransit(driverId, id);
  }
  public rejectTransit(driverId: string, id: string) {
    return this.demands.rejectTransit(driverId, id);
  }

  public completeTransitFromDto(
    driverId: string,
    id: string,
    destination: AddressDto,
  ) {
    return this.completions.completeTransitFromDto(driverId, id, destination);
  }

  public completeTransit(driverId: string, id: string, destination: Address) {
    return this.completions.completeTransit(driverId, id, destination);
  }

  public loadTransit(id: string) {
    return this.details.getView(id);
  }
}
