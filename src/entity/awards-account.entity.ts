import { BaseEntity } from '../common/base.entity';
import { Entity, Property, OneToOne } from '@mikro-orm/core';
import { Client } from './client.entity';
import { AwardsAccountRepository } from '../repository/awards-account.repository';

@Entity({ repository: () => AwardsAccountRepository })
export class AwardsAccount extends BaseEntity {
  @Property({ type: 'bigint' })
  public date: number = Date.now();

  @Property({ default: false, type: 'boolean' })
  public isActive: boolean = false;

  @Property({ default: 0, type: 'integer' })
  public transactions: number = 0;

  @OneToOne(() => Client, { owner: true, eager: true })
  public client!: Client;

  public setClient(client: Client) {
    this.client = client;
  }

  public getClient() {
    return this.client;
  }

  public setDate(date: number) {
    this.date = date;
  }

  public setActive(active: boolean) {
    this.isActive = active;
  }

  public isAwardActive() {
    return this.isActive;
  }

  public getTransactions() {
    return this.transactions;
  }

  public increaseTransactions() {
    this.transactions++;
  }

  public getDate() {
    return this.date;
  }
}
