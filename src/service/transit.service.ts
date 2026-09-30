import { DomainEvents } from '../common/domain-events';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { EntityManager } from '@mikro-orm/postgresql';
import { ClientRepository } from '../crm/client.repository';
import { TransitRepository } from '../repository/transit.repository';
import { DriverRepository } from '../driverfleet/driver.repository';
import { AddressRepository } from '../geolocation/address/address.repository';
import { AwardsService } from '../loyalty/awards.service';
import { DriverFeeService } from '../driverfleet/driver-fee.service';
import { GeocodingService } from '../geolocation/geocoding.service';
import { InvoiceGenerator } from '../invoicing/invoice-generator.service';
import { DistanceCalculator } from '../geolocation/distance-calculator.service';
import { DriverFinder } from './driver-finder.service';
import { TransitDetailsFacade } from '../transitdetails/transit-details.facade';
import { transitSnapshot } from '../transitdetails/transit-snapshot';
import { AddressDto } from '../geolocation/address/address.dto';
import { CarClass } from '../carfleet/car-type.entity';
import { Address } from '../geolocation/address/address.entity';
import { Status, Transit } from '../entity/transit.entity';
import { DriverNotificationService } from '../notification/driver-notification.service';
import { Driver } from '../driverfleet/driver.entity';
import { CreateTransitDto } from '../dto/create-transit.dto';
import { Client } from '../crm/client.entity';
import { Distance } from '../geolocation/distance';

@Injectable()
export class TransitService {
  constructor(
    @InjectRepository(Client) private readonly clients: ClientRepository,
    @InjectRepository(Transit) private readonly transits: TransitRepository,
    @InjectRepository(Driver) private readonly drivers: DriverRepository,
    @InjectRepository(Address) private readonly addresses: AddressRepository,
    private readonly awards: AwardsService,
    private readonly fees: DriverFeeService,
    private readonly geocoding: GeocodingService,
    private readonly invoices: InvoiceGenerator,
    private readonly distances: DistanceCalculator,
    private readonly notifications: DriverNotificationService,
    private readonly finder: DriverFinder,
    private readonly em: EntityManager,
    private readonly events: DomainEvents,
    private readonly details: TransitDetailsFacade,
  ) {}

  @Transactional()
  public async createTransit(dto: CreateTransitDto) {
    const from = await this.addresses.saveAddress(
      new AddressDto(dto.from).toAddressEntity(),
    );
    const to = await this.addresses.saveAddress(
      new AddressDto(dto.to).toAddressEntity(),
    );
    return this._createTransit(dto.clientId, from, to, dto.carClass);
  }

  @Transactional()
  public async _createTransit(
    clientId: string,
    from: Address,
    to: Address,
    carClass: CarClass,
  ) {
    const client = await this.clients.findOneOrFail({ id: clientId });
    const transit = new Transit();
    transit.setClient(client);
    transit.setFrom(from);
    transit.setTo(to);
    transit.setCarType(carClass);
    transit.setStatus(Status.DRAFT);
    transit.setDateTime(Date.now());
    transit.setKm(this.distanceBetween(from, to).toKm());
    this.em.persist(transit);
    await this.save(transit);
    return transit;
  }

  @Transactional()
  public async _changeTransitAddressFrom(transitId: string, address: Address) {
    const transit = await this.loadEntity(transitId);
    const pickup = await this.addresses.saveAddress(address);
    const oldLocation = this.geocoding.geocodeAddress(transit.getFrom());
    const newLocation = this.geocoding.geocodeAddress(pickup);
    const distanceFromPrevious = this.distances.calculateByGeo(
      oldLocation[0],
      oldLocation[1],
      newLocation[0],
      newLocation[1],
    );
    transit.changePickupTo(
      pickup,
      this.distanceBetween(pickup, transit.getTo()),
      distanceFromPrevious,
    );
    for (const driver of transit.getProposedDrivers()) {
      this.notifications.notifyAboutChangedTransitAddress(
        driver.id,
        transit.id,
      );
    }
    await this.save(transit);
  }

  public changeTransitAddressFrom(transitId: string, address: AddressDto) {
    return this._changeTransitAddressFrom(transitId, address.toAddressEntity());
  }

  @Transactional()
  public async changeTransitAddressTo(transitId: string, address: AddressDto) {
    const transit = await this.loadEntity(transitId);
    const destination = await this.addresses.saveAddress(
      address.toAddressEntity(),
    );
    transit.changeDestinationTo(
      destination,
      this.distanceBetween(transit.getFrom(), destination),
    );
    const driver = transit.getDriver();
    if (driver)
      this.notifications.notifyAboutChangedTransitAddress(
        driver.id,
        transit.id,
      );
    await this.save(transit);
  }

  @Transactional()
  public async cancelTransit(transitId: string) {
    const transit = await this.loadEntity(transitId);
    const driver = transit.getDriver();
    transit.cancel();
    if (driver) {
      driver.setOccupied(false);
      this.notifications.notifyAboutCancelledTransit(driver.id, transit.id);
    }
    await this.save(transit);
  }

  @Transactional()
  public async publishTransit(transitId: string) {
    const transit = await this.loadEntity(transitId);
    transit.publishAt(Date.now());
    return this.findDriversForTransit(transit.id);
  }

  @Transactional()
  public async findDriversForTransit(transitId: string) {
    const transit = await this.finder.findFor(await this.loadEntity(transitId));
    await this.save(transit);
    return transit;
  }

  @Transactional()
  public async acceptTransit(driverId: string, transitId: string) {
    const transit = await this.loadEntity(transitId);
    transit.acceptBy(await this.loadDriver(driverId), Date.now());
    await this.save(transit);
  }

  @Transactional()
  public async startTransit(driverId: string, transitId: string) {
    await this.loadDriver(driverId);
    const transit = await this.loadEntity(transitId);
    transit.start(Date.now());
    await this.save(transit);
  }

  @Transactional()
  public async rejectTransit(driverId: string, transitId: string) {
    const transit = await this.loadEntity(transitId);
    transit.rejectBy(await this.loadDriver(driverId));
    await this.save(transit);
  }

  public completeTransitFromDto(
    driverId: string,
    transitId: string,
    destination: AddressDto,
  ) {
    return this.completeTransit(
      driverId,
      transitId,
      destination.toAddressEntity(),
    );
  }

  @Transactional()
  public async completeTransit(
    driverId: string,
    transitId: string,
    destination: Address,
  ) {
    const driver = await this.loadDriver(driverId);
    const transit = await this.loadEntity(transitId);
    const address = await this.addresses.saveAddress(destination);
    transit.complete(
      Date.now(),
      address,
      this.distanceBetween(transit.getFrom(), address),
    );
    driver.setOccupied(false);
    transit.setDriversFee(
      await this.fees.calculateDriverFee(driver.id, transit.getPrice()!),
    );
    await this.awards.registerMiles(transit.getClient().id, transitId);
    await this.invoices.generate(
      transit.getPrice()!.toMajor(),
      `${transit.getClient().getName()} ${transit.getClient().getLastName()}`,
    );
    await this.save(transit);
    await this.events.publish({
      type: 'transit-completed',
      transitId: transit.id,
      clientId: transit.getClient().id,
      fromHash: transit.getFrom().getHash(),
      toHash: transit.getTo().getHash(),
      started: transit.getStarted()!,
      completeAt: transit.getCompleteAt()!,
    });
  }

  public async loadTransit(transitId: string) {
    return this.details.getView(transitId);
  }

  private async save(transit: Transit) {
    await this.em.flush();
    await this.details.record(transitSnapshot(transit));
  }

  private async loadEntity(id: string): Promise<Transit> {
    const transit = await this.transits.findOne({ id });
    if (!transit)
      throw new NotFoundException(`Transit does not exist, id = ${id}`);
    return transit;
  }

  private async loadDriver(id: string): Promise<Driver> {
    const driver = await this.drivers.findOne({ id });
    if (!driver)
      throw new NotFoundException(`Driver does not exist, id = ${id}`);
    return driver;
  }

  private distanceBetween(from: Address, to: Address): Distance {
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
}
