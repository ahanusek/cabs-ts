import { BaseEntity } from '../common/base.entity';
import { Entity, Property } from '@mikro-orm/core';
import * as objectHash from 'object-hash';
import { AddressRepository } from '../repository/address.repository';

@Entity({ repository: () => AddressRepository })
export class Address extends BaseEntity {
  @Property()
  public country!: string;

  @Property({ nullable: true, type: 'varchar' })
  public district: string | null = null;

  @Property()
  public city!: string;

  @Property()
  public street!: string;

  @Property()
  public buildingNumber!: number;

  @Property({ nullable: true, type: 'integer' })
  public additionalNumber: number | null = null;

  @Property()
  public postalCode!: string;

  @Property()
  public name!: string;

  @Property({ unique: true })
  public hash!: string;

  constructor(
    country?: string,
    city?: string,
    street?: string,
    buildingNumber?: number,
  ) {
    super();
    if (country) this.country = country;
    if (city) this.city = city;
    if (street) this.street = street;
    if (buildingNumber) this.buildingNumber = buildingNumber;
  }

  public getCountry() {
    return this.country;
  }

  public setCountry(country: string) {
    this.country = country;
  }

  public getDistrict() {
    return this.district;
  }

  public setDistrict(district: string | null) {
    this.district = district;
  }

  public getCity() {
    return this.city;
  }

  public setCity(city: string) {
    this.city = city;
  }

  public getStreet() {
    return this.street;
  }

  public setStreet(street: string) {
    this.street = street;
  }

  public getBuildingNumber() {
    return this.buildingNumber;
  }

  public setBuildingNumber(buildingNumber: number) {
    this.buildingNumber = buildingNumber;
  }

  public getAdditionalNumber() {
    return this.additionalNumber;
  }

  public setAdditionalNumber(additionalNumber: number | null) {
    this.additionalNumber = additionalNumber;
  }

  public getPostalCode() {
    return this.postalCode;
  }

  public setPostalCode(postalCode: string) {
    this.postalCode = postalCode;
  }

  public getName() {
    return this.name;
  }

  public setName(name: string) {
    this.name = name;
  }

  public setHash() {
    this.hash = objectHash({
      country: this.country,
      district: this.district,
      city: this.city,
      street: this.street,
      buildingNumber: this.buildingNumber,
      additionalNumber: this.additionalNumber,
      postalCode: this.postalCode,
      name: this.name,
    });
  }

  public getHash() {
    this.setHash();
    return this.hash;
  }

  public toString() {
    return (
      'Address{' +
      "id='" +
      this.getId() +
      "'" +
      ", country='" +
      this.country +
      "'" +
      ", district='" +
      this.district +
      "'" +
      ", city='" +
      this.city +
      "'" +
      ", street='" +
      this.street +
      "'" +
      ', buildingNumber=' +
      this.buildingNumber +
      ', additionalNumber=' +
      this.additionalNumber +
      ", postalCode='" +
      this.postalCode +
      "'" +
      ", name='" +
      this.name +
      "'" +
      '}'
    );
  }
}
