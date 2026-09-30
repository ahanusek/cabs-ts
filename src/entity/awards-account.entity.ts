import type { MilesComparator } from '../loyalty/miles-spending-policy';
import { Collection } from '@mikro-orm/core';
import {
  Entity,
  Property,
  OneToOne,
  OneToMany,
} from '@mikro-orm/decorators/legacy';
import { NotAcceptableException } from '@nestjs/common';
import { BaseEntity } from '../common/base.entity';
import { Client } from './client.entity';

import { AwardedMiles } from './awarded-miles.entity';
import { AwardsAccountRepository } from '../repository/awards-account.repository';
import { ConstantUntil } from '../loyalty/miles/constant-until';
import { Miles, requireMilesAmount } from '../loyalty/miles/miles';

@Entity({ repository: () => AwardsAccountRepository })
export class AwardsAccount extends BaseEntity {
  @Property({ type: 'bigint', runtimeType: 'number' })
  private date: number;

  @Property({ default: false, type: 'boolean' })
  private isActive = false;

  @Property({ default: 0, type: 'integer' })
  private transactions = 0;

  @OneToOne(() => Client, { owner: true, eager: true })
  public client: Client;

  @OneToMany(() => AwardedMiles, (grant) => grant.account, { eager: true })
  private miles = new Collection<AwardedMiles>(this);

  constructor(client: Client, date = Date.now()) {
    super();
    this.client = client;
    this.date = date;
  }

  public activate(): void {
    this.isActive = true;
  }
  public deactivate(): void {
    this.isActive = false;
  }
  public isAwardActive(): boolean {
    return this.isActive;
  }
  public getClient(): Client {
    return this.client;
  }
  public getDate(): number {
    return this.date;
  }
  public getTransactions(): number {
    return this.transactions;
  }

  public addExpiringMiles(
    amount: number,
    expiration: number,
    transitId: string,
    now: number,
  ): AwardedMiles | null {
    if (!this.isActive) return null;
    return this.addMiles(new ConstantUntil(amount, expiration), now, transitId);
  }

  public addNonExpiringMiles(amount: number, now: number): AwardedMiles {
    return this.addMiles(ConstantUntil.forever(amount), now, null);
  }

  public getMiles(): readonly AwardedMiles[] {
    return [...this.miles.getItems()];
  }

  public calculateBalance(moment: number): number {
    return this.miles
      .getItems()
      .reduce((balance, grant) => balance + grant.getMilesAmount(moment), 0);
  }

  public remove(
    amount: number,
    moment: number,
    strategy: MilesComparator,
  ): void {
    requireMilesAmount(amount);
    if (!this.canSpend(amount, moment)) {
      throw new NotAcceptableException(
        'Insufficient miles or inactive account',
      );
    }
    const grants = [...this.miles.getItems()].sort(strategy);
    let remaining = amount;
    for (const grant of grants) {
      if (remaining === 0) break;
      const consumed = Math.min(grant.getMilesAmount(moment), remaining);
      grant.subtract(consumed, moment);
      remaining -= consumed;
    }
  }

  public moveMilesTo(
    destination: AwardsAccount,
    amount: number,
    moment: number,
  ): void {
    requireMilesAmount(amount);
    if (
      !this.canSpend(amount, moment) ||
      this.id === destination.id ||
      amount === 0
    )
      return;
    let remaining = amount;
    for (const grant of this.miles.getItems()) {
      if (remaining === 0) break;
      const transferred = Math.min(grant.getMilesAmount(moment), remaining);
      if (transferred === 0) continue;
      grant.subtract(transferred, moment);
      const received = new AwardedMiles(
        destination,
        new ConstantUntil(transferred, grant.getExpirationDate()),
        grant.getDate(),
        null,
      );
      destination.miles.add(received);
      remaining -= transferred;
    }
    this.transactions++;
    destination.transactions++;
  }

  private canSpend(amount: number, moment: number): boolean {
    return this.isActive && this.calculateBalance(moment) >= amount;
  }

  private addMiles(
    miles: Miles,
    now: number,
    transitId: string | null,
  ): AwardedMiles {
    const grant = new AwardedMiles(this, miles, now, transitId);
    this.miles.add(grant);
    this.transactions++;
    return grant;
  }
}
