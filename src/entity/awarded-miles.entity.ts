import { BaseEntity } from '../common/base.entity';
import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { Client } from './client.entity';
import { Transit } from './transit.entity';
import { AwardedMilesRepository } from '../repository/awarded-miles.repository';

@Entity({ repository: () => AwardedMilesRepository })
export class AwardedMiles extends BaseEntity {
  @ManyToOne(() => Client)
  public client!: Client;

  @Property()
  private miles!: number;

  @Property({ type: 'bigint' })
  private date: number = Date.now();

  @Property({ nullable: true, type: 'bigint' })
  private expirationDate: number | null = null;

  @Property({ nullable: true, type: 'boolean' })
  private isSpecial: boolean | null = null;

  @ManyToOne(() => Transit, { nullable: true })
  public transit: Transit | null = null;

  public getClient() {
    return this.client;
  }

  public setClient(client: Client) {
    this.client = client;
  }

  public getMiles() {
    return this.miles;
  }

  public setMiles(miles: number) {
    this.miles = miles;
  }

  public getDate() {
    return this.date;
  }

  public setDate(date: number) {
    this.date = date;
  }

  public getExpirationDate() {
    return this.expirationDate;
  }

  public setExpirationDate(expirationDate: number) {
    this.expirationDate = expirationDate;
  }

  public getSpecial() {
    return this.isSpecial;
  }

  public setSpecial(special: boolean) {
    this.isSpecial = special;
  }

  public setTransit(transit: Transit | null) {
    this.transit = transit;
  }
}
