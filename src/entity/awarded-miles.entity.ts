import { AwardsAccount } from './awards-account.entity';
import type { Miles } from '../loyalty/miles/miles';
import { type MilesSnapshot, restoreMiles } from '../loyalty/miles/miles-json';
import { BaseEntity } from '../common/base.entity';
import { Entity, Property, ManyToOne } from '@mikro-orm/decorators/legacy';
import { Client } from './client.entity';

@Entity()
export class AwardedMiles extends BaseEntity {
  @ManyToOne(() => AwardsAccount)
  public account: AwardsAccount;

  constructor(
    account: AwardsAccount,
    miles: Miles,
    date: number,
    transitId: string | null,
  ) {
    super();
    this.account = account;
    this.client = account.getClient();
    this.miles = miles.snapshot();
    this.date = date;
    this.transitId = transitId;
  }

  @ManyToOne(() => Client)
  public client!: Client;

  @Property({ type: 'json' })
  private miles!: MilesSnapshot;

  @Property({ type: 'bigint', runtimeType: 'number' })
  private date: number = Date.now();

  @Property({ type: 'uuid', nullable: true })
  public transitId: string | null = null;

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

  public setTransitId(transitId: string | null) {
    this.transitId = transitId;
  }
}
