import { Injectable } from '@nestjs/common';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { EntityManager } from '@mikro-orm/postgresql';

import { ClientService } from '../crm/client.service';

import { RouteService } from '../geolocation/route.service';
import { AddressDto } from '../geolocation/address/address.dto';
import { Address } from '../geolocation/address/address.entity';
import { CarClass } from '../carfleet/car-type.entity';

import { Tariff } from '../pricing/tariff';
import { CreateTransitDto } from './create-transit.dto';
import { TransitDetailsFacade } from './details/transit-details.facade';

import { requestSnapshot } from './details/request-snapshot';
import { RequestForTransit } from './request-for-transit.entity';

@Injectable()
export class RequestTransitService {
  constructor(
    private readonly clients: ClientService,
    private readonly routes: RouteService,
    private readonly em: EntityManager,
    private readonly details: TransitDetailsFacade,
  ) {}

  @Transactional()
  public async createTransit(dto: CreateTransitDto) {
    return this.createTransitFromAddresses(
      dto.clientId,
      new AddressDto(dto.from).toAddressEntity(),
      new AddressDto(dto.to).toAddressEntity(),
      dto.carClass,
    );
  }

  @Transactional()
  public async createTransitFromAddresses(
    clientId: string,
    origin: Address,
    destination: Address,
    carClass: CarClass,
  ) {
    const client = await this.clients.load(clientId);
    const from = await this.routes.save(origin);
    const to = await this.routes.save(destination);
    const now = Date.now();
    const request = new RequestForTransit(
      Tariff.ofTime(new Date(now)),
      this.routes.distance(from, to),
    );
    await this.em.persist(request).flush();
    await this.details.record(
      requestSnapshot(request, { client, from, to, carClass, now }),
    );
    return request;
  }
}
