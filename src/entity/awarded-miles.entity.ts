import { AwardsAccount } from './awards-account.entity';
import type { Miles } from '../loyalty/miles/miles';
import { type MilesSnapshot, restoreMiles } from '../loyalty/miles/miles-json';
import { BaseEntity } from '../common/base.entity';
import { Entity, Property, ManyToOne } from '@mikro-orm/decorators/legacy';
import { Client } from './client.entity';
import { Transit } from './transit.entity';
import { AwardedMilesRepository } from '../repository/awarded-miles.repository';

@Entity({ repository: () => AwardedMilesRepository })
export class AwardedMiles extends BaseEntity {
  @ManyToOne(() => AwardsAccount)
  public account: AwardsAccount;

  constructor(
    account: AwardsAccount,
    miles: Miles,
    date: number,
    transit: Transit | null,
  ) {
    super();
    this.account = account;
    this.client = account.getClient();
    this.miles = miles.snapshot();
    this.date = date;
    this.transit = transit;
  }

  @ManyToOne(() => Client)
  public client!: Client;

  @Property({ type: 'json' })
  private miles!: MilesSnapshot;

  @Property({ type: 'bigint', runtimeType: 'number' })
  private date: number = Date.now();

  @ManyToOne(() => Transit, { nullable: true })
  public transit: Transit | null = null;

  public getClient() {
    return this.client;
  }

  public setClient(client: Client) {
    this.client = client;
  }

  public getMiles(): Miles {
    return restoreMiles(this.miles);
  }

  public getMilesAmount(moment: number): number {
    return this.getMiles().getAmountFor(moment);
  }

  public setMiles(miles: Miles): void {
    this.miles = miles.snapshot();
  }

  public subtract(amount: number, moment: number): void {
    this.setMiles(this.getMiles().subtract(amount, moment));
  }

  public getDate() {
    return this.date;
  }

  public setDate(date: number) {
    this.date = date;
  }

  public getExpirationDate(): number {
    return this.getMiles().expiresAt();
  }

  public cantExpire(): boolean {
    return this.getExpirationDate() === Infinity;
  }

  public setTransit(transit: Transit | null) {
    this.transit = transit;
  }
}
