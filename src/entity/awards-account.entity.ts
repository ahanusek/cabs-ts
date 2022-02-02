import { BaseEntity } from '../common/base.entity';
import { Column, Entity, OneToOne } from 'typeorm';
import { Client } from './client.entity';

@Entity()
export class AwardsAccount extends BaseEntity {
  @Column({ default: Date.now(), type: 'bigint' })
  private date: number;

  @Column({ default: false })
  private isActive: boolean;

  @Column({ default: 0 })
  private transactions: number;

  @OneToOne(() => Client)
  private client: Client;

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
