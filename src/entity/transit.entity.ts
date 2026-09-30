import { Tariff } from '../pricing/tariff';
import { Distance } from '../distance/distance';
import { Embedded } from '@mikro-orm/decorators/legacy';
import { Money } from '../money/money';
import { MoneyType } from '../money/money.type';
import { ForbiddenException } from '@nestjs/common';
import { BaseEntity } from '../common/base.entity';
import { Collection } from '@mikro-orm/core';
import {
  Entity,
  Property,
  ManyToOne,
  ManyToMany,
  Enum,
} from '@mikro-orm/decorators/legacy';
import { Driver } from './driver.entity';
import { Client, PaymentType } from './client.entity';
import { Address } from './address.entity';
import { CarClass } from './car-type.entity';
import { TransitRepository } from '../repository/transit.repository';

export enum Status {
  DRAFT = 'draft',
  CANCELLED = 'cancelled',
  WAITING_FOR_DRIVER_ASSIGNMENT = 'waiting_for_driver_assignment',
  DRIVER_ASSIGNMENT_FAILED = 'driver_assignment_failed',
  TRANSIT_TO_PASSENGER = 'transit_to_passenger',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
}

export enum DriverPaymentStatus {
  NOT_PAID = 'not_paid',
  PAID = 'paid',
  CLAIMED = 'claimed',
  RETURNED = 'returned',
}

export enum ClientPaymentStatus {
  NOT_PAID = 'not_paid',
  PAID = 'paid',
  RETURNED = 'returned',
}

@Entity({ repository: () => TransitRepository })
export class Transit extends BaseEntity {
  @Embedded(() => Tariff)
  private tariff: Tariff = Tariff.ofTime(new Date());

  public getTariff(): Tariff {
    return this.tariff;
  }

  @ManyToOne(() => Driver, { nullable: true, eager: true })
  public driver: Driver | null = null;

  @Enum({ items: () => DriverPaymentStatus, nullable: true })
  public driverPaymentStatus?: DriverPaymentStatus;

  @Enum({ items: () => ClientPaymentStatus, nullable: true })
  public clientPaymentStatus?: ClientPaymentStatus;

  @Enum({ items: () => PaymentType, nullable: true })
  public paymentType?: PaymentType;

  @Enum(() => Status)
  public status!: Status;

  @Property({ type: 'bigint', nullable: true })
  public date?: number;

  @ManyToOne(() => Address, { eager: true })
  public from!: Address;

  @ManyToOne(() => Address, { eager: true })
  public to!: Address;

  @Property({ nullable: true, type: 'bigint' })
  public acceptedAt: number | null = null;

  @Property({ nullable: true, type: 'bigint' })
  public started: number | null = null;

  @Property({ default: 0 })
  public pickupAddressChangeCounter: number = 0;

  @ManyToMany(() => Driver)
  public driversRejections = new Collection<Driver>(this);

  @ManyToMany(() => Driver)
  public proposedDrivers = new Collection<Driver>(this);

  @Property({ default: 0, type: 'integer' })
  public awaitingDriversResponses: number = 0;

  @Property({ nullable: true, type: 'varchar' })
  public factor: number | null = null;

  @Property({ default: 0 })
  public km: number = 0;

  @Property({ nullable: true, type: MoneyType })
  public price: Money | null = null;

  @Property({ nullable: true, type: MoneyType })
  public estimatedPrice: Money | null = null;

  @Property({ nullable: true, type: MoneyType })
  public driversFee?: Money;

  @Property({ type: 'bigint', nullable: true })
  public dateTime?: number;

  @Property({ type: 'bigint', nullable: true })
  public published?: number;

  @ManyToOne(() => Client, { eager: true })
  public client!: Client;

  @Enum(() => CarClass)
  public carType!: CarClass;

  @Property({ type: 'bigint', nullable: true })
  public completeAt?: number;

  public getCarType() {
    return this.carType as CarClass;
  }

  public setCarType(carType: CarClass) {
    this.carType = carType;
  }

  public getDriver() {
    return this.driver;
  }

  public getPrice() {
    return this.price;
  }

  public setPrice(price: Money) {
    this.price = price;
  }

  public getStatus() {
    return this.status;
  }

  public setStatus(status: Status) {
    this.status = status;
  }

  public getCompleteAt() {
    return this.completeAt;
  }

  public getClient() {
    return this.client;
  }

  public setClient(client: Client) {
    this.client = client;
  }

  public setDateTime(dateTime: number) {
    this.dateTime = dateTime;
    this.tariff = Tariff.ofTime(new Date(dateTime));
  }

  public getDateTime() {
    return this.dateTime;
  }

  public getPublished() {
    return this.published;
  }

  public setPublished(published: number) {
    this.published = published;
  }

  public setDriver(driver: Driver | null) {
    this.driver = driver;
  }

  public getKm() {
    return this.km;
  }

  public setKm(km: number) {
    this.km = km;
    this.estimateCost();
  }

  public getAwaitingDriversResponses() {
    return this.awaitingDriversResponses;
  }

  public setAwaitingDriversResponses(proposedDriversCounter: number) {
    this.awaitingDriversResponses = proposedDriversCounter;
  }

  public getDriversRejections() {
    return this.driversRejections.getItems();
  }

  public setDriversRejections(driversRejections: Driver[]) {
    this.driversRejections.set(driversRejections);
  }

  public getProposedDrivers() {
    return this.proposedDrivers.getItems();
  }

  public setProposedDrivers(proposedDrivers: Driver[]) {
    this.proposedDrivers.set(proposedDrivers);
  }

  public getAcceptedAt() {
    return this.acceptedAt;
  }

  public setAcceptedAt(acceptedAt: number) {
    this.acceptedAt = acceptedAt;
  }

  public getStarted() {
    return this.started;
  }

  public setStarted(started: number) {
    this.started = started;
  }

  public getFrom() {
    return this.from;
  }

  public setFrom(from: Address) {
    this.from = from;
  }

  public getTo() {
    return this.to;
  }

  public setTo(to: Address) {
    this.to = to;
  }

  public getPickupAddressChangeCounter() {
    return this.pickupAddressChangeCounter;
  }

  public setPickupAddressChangeCounter(pickupChanges: number) {
    this.pickupAddressChangeCounter = pickupChanges;
  }

  public setCompleteAt(when: number) {
    this.completeAt = when;
  }

  public getDriversFee() {
    return this.driversFee;
  }

  public setDriversFee(driversFee: Money) {
    this.driversFee = driversFee;
  }

  public getEstimatedPrice() {
    return this.estimatedPrice;
  }

  public setEstimatedPrice(estimatedPrice: Money) {
    this.estimatedPrice = estimatedPrice;
  }

  public estimateCost() {
    if (this.status === Status.COMPLETED) {
      throw new ForbiddenException(
        'Estimating cost for completed transit is forbidden, id = ' +
          this.getId(),
      );
    }

    this.estimatedPrice = this.calculateCost();

    this.price = null;

    return this.estimatedPrice;
  }

  public calculateFinalCosts(): Money {
    if (this.status === Status.COMPLETED) {
      return this.calculateCost();
    } else {
      throw new ForbiddenException(
        'Cannot calculate final cost if the transit is not completed',
      );
    }
  }

  private calculateCost(): Money {
    this.price = this.tariff.calculateCost(Distance.ofKm(this.km));
    return this.price;
  }
}
