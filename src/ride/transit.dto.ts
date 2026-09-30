import type { TransitView } from './details/transit-view';
import { Tariff } from '../pricing/tariff';
import { Distance } from '../geolocation/distance';
import { Status } from './transit.entity';
import { DriverDto } from '../driverfleet/driver.dto';
import { ClaimDto } from '../crm/claims/claim.dto';
import { AddressDto } from '../geolocation/address/address.dto';
import { CarClass } from '../carfleet/car-type.entity';
import { ClientDto } from '../crm/client.dto';
import { NotAcceptableException } from '@nestjs/common';

export class TransitDto {
  public id: string;

  public tariff: string;

  public status: Status;

  public driver: DriverDto;

  public factor: number | null;

  public distance: number;

  public distanceUnit: string;

  public kmRate: number;

  public price: number;

  public driverFee: number;

  public estimatedPrice: number;

  public baseFee: number;

  public date: number;

  public dateTime: number;

  public published: number;

  public acceptedAt: number | null;

  public started: number | null;

  public completeAt: number | null;

  public claimDto: ClaimDto;

  public proposedDrivers: DriverDto[] = [];

  public to: AddressDto;

  public from: AddressDto;

  public carClass: CarClass;

  public clientDto: ClientDto;

  constructor(view: TransitView) {
    Object.assign(this, view);
  }

  public getKmRate() {
    return this.kmRate;
  }

  public setTariff(tariff: Tariff = Tariff.ofTime(new Date())) {
    this.tariff = tariff.getName();
    this.kmRate = tariff.getKmRate();
    this.baseFee = tariff.getBaseFee();
  }

  public getTariff() {
    return this.tariff;
  }

  public getDistance(unit: string) {
    this.distanceUnit = unit;
    try {
      return Distance.ofKm(this.distance).printIn(unit);
    } catch {
      throw new NotAcceptableException('Invalid distance or unit ' + unit);
    }
  }

  public getProposedDrivers() {
    return this.proposedDrivers;
  }

  public setProposedDrivers(proposedDrivers: DriverDto[]) {
    this.proposedDrivers = proposedDrivers;
  }

  public getClaimDTO() {
    return this.claimDto;
  }

  public setClaimDTO(claimDto: ClaimDto) {
    this.claimDto = claimDto;
  }

  public getTo() {
    return this.to;
  }

  public setTo(to: AddressDto) {
    this.to = to;
  }

  public getFrom() {
    return this.from;
  }

  public setFrom(from: AddressDto) {
    this.from = from;
  }

  public getCarClass() {
    return this.carClass;
  }

  public setCarClass(carClass: CarClass) {
    this.carClass = carClass;
  }

  public getClientDto() {
    return this.clientDto;
  }

  public setClientDTO(clientDto: ClientDto) {
    this.clientDto = clientDto;
  }

  public getId() {
    return this.id;
  }

  public getStatus() {
    return this.status;
  }

  public setStatus(status: Status) {
    this.status = status;
  }

  public getPrice() {
    return this.price;
  }

  public getDriverFee() {
    return this.driverFee;
  }

  public setDriverFee(driverFee: number) {
    this.driverFee = driverFee;
  }

  public getDateTime() {
    return this.dateTime;
  }

  public setDateTime(dateTime: number) {
    this.dateTime = dateTime;
  }

  public getPublished() {
    return this.published;
  }

  public setPublished(published: number) {
    this.published = published;
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

  public getCompleteAt() {
    return this.completeAt;
  }

  public setCompleteAt(completeAt: number) {
    this.completeAt = completeAt;
  }

  public getEstimatedPrice() {
    return this.estimatedPrice;
  }

  public setEstimatedPrice(estimatedPrice: number) {
    this.estimatedPrice = estimatedPrice;
  }
}
