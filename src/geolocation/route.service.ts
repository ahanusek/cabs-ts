import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Address } from './address/address.entity';
import { AddressRepository } from './address/address.repository';
import { Distance } from './distance';
import { GeocodingService } from './geocoding.service';
import { DistanceCalculator } from './distance-calculator.service';

@Injectable()
export class RouteService {
  constructor(
    @InjectRepository(Address) private readonly addresses: AddressRepository,
    private readonly geocoding: GeocodingService,
    private readonly distances: DistanceCalculator,
  ) {}
  public save(address: Address) {
    return this.addresses.saveAddress(address);
  }
  public async find(id: string) {
    const address = await this.addresses.findOne({ id });
    if (!address) throw new NotFoundException(`Address ${id} does not exist`);
    return address;
  }
  public distance(from: Address, to: Address) {
    const origin = this.geocoding.geocodeAddress(from);
    const destination = this.geocoding.geocodeAddress(to);
    return Distance.ofKm(
      this.distances.calculateByMap(
        origin[0],
        origin[1],
        destination[0],
        destination[1],
      ),
    );
  }
  public distanceFromPreviousPickup(previous: Address, next: Address) {
    const origin = this.geocoding.geocodeAddress(previous);
    const destination = this.geocoding.geocodeAddress(next);
    return this.distances.calculateByGeo(
      origin[0],
      origin[1],
      destination[0],
      destination[1],
    );
  }
}
