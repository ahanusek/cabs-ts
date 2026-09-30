import { Status } from './status';
import { Address } from '../../geolocation/address/address.entity';
import { AddressDto } from '../../geolocation/address/address.dto';
import { Distance } from '../../geolocation/distance';
import { Money } from '../../money/money';
import { Tariff } from '../../pricing/tariff';
import type { ReportDriver } from './transit-view';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { TransitDetails } from './transit-details.entity';
import type { TransitSnapshot } from './transit-details.entity';

@Injectable()
export class TransitDetailsFacade {
  constructor(private readonly em: EntityManager) {}

  public async record(snapshot: TransitSnapshot): Promise<void> {
    await this.em.upsert(TransitDetails, new TransitDetails(snapshot));
  }

  public async find(transitId: string): Promise<TransitDetails> {
    const details = await this.em.findOne(TransitDetails, { transitId });
    if (!details)
      throw new NotFoundException(`Transit ${transitId} does not exist`);
    return details;
  }

  public async getView(transitId: string) {
    return structuredClone((await this.find(transitId)).view);
  }

  public async driverEarnings(
    driverId: string,
    from: number,
    to: number,
  ): Promise<number> {
    const rows = await this.em.execute<{ total: string }[]>(
      `select coalesce(sum((view->>'driverFee')::numeric), 0) as total
       from transit_details where driver_id = ? and status = 'completed'
       and complete_at between ? and ?`,
      [driverId, from, to],
    );
    return Number(rows[0].total);
  }

  public async pickupChanged(
    id: string,
    address: Address,
    distance: Distance,
    estimate: Money,
  ) {
    const details = await this.find(id);
    details.fromAddressId = address.id;
    details.fromHash = address.getHash();
    details.view.from = new AddressDto(address);
    details.view.distance = distance.toKm();
    details.view.estimatedPrice = estimate.toMajor();
    await this.em.flush();
  }

  public async destinationChanged(
    id: string,
    address: Address,
    distance: Distance,
    estimate: Money,
  ) {
    const details = await this.find(id);
    details.toAddressId = address.id;
    details.toHash = address.getHash();
    details.view.to = new AddressDto(address);
    details.view.distance = distance.toKm();
    details.view.estimatedPrice = estimate.toMajor();
    await this.em.flush();
  }

  public async published(id: string, now: number) {
    const details = await this.find(id);
    details.view.published = now;
    await this.changeStatus(details, Status.WAITING_FOR_DRIVER_ASSIGNMENT);
  }

  public async driversProposed(id: string, drivers: ReportDriver[]) {
    const details = await this.find(id);
    details.view.proposedDrivers = drivers;
    await this.em.flush();
  }

  public async assignmentFailed(id: string) {
    await this.changeStatus(
      await this.find(id),
      Status.DRIVER_ASSIGNMENT_FAILED,
    );
  }
  public async cancelled(id: string) {
    await this.changeStatus(await this.find(id), Status.CANCELLED);
  }

  public async accepted(id: string, driverId: string, now: number) {
    const details = await this.find(id);
    details.driverId = driverId;
    details.view.driverId = driverId;
    details.view.acceptedAt = now;
    await this.changeStatus(details, Status.TRANSIT_TO_PASSENGER);
  }

  public async started(id: string, now: number, tariff: Tariff) {
    const details = await this.find(id);
    details.view.started = now;
    details.view.tariff = tariff.getName();
    details.view.kmRate = tariff.getKmRate();
    details.view.baseFee = tariff.getBaseFee();
    await this.changeStatus(details, Status.IN_TRANSIT);
  }

  public async completed(
    id: string,
    now: number,
    price: Money,
    fee: Money,
    destination: Address,
    distance: Distance,
  ) {
    const details = await this.find(id);
    details.completeAt = now;
    details.view.completeAt = now;
    details.view.price = price.toMajor();
    details.view.driverFee = fee.toMajor();
    details.toAddressId = destination.id;
    details.toHash = destination.getHash();
    details.view.to = new AddressDto(destination);
    details.view.distance = distance.toKm();
    await this.changeStatus(details, Status.COMPLETED);
  }

  private async changeStatus(details: TransitDetails, status: Status) {
    details.status = status;
    details.view.status = status;
    await this.em.flush();
  }

  public countByClient(clientId: string) {
    return this.em.count(TransitDetails, { clientId });
  }
}
