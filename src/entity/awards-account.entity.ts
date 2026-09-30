import { Collection } from '@mikro-orm/core';
import {
  Entity,
  Property,
  OneToOne,
  OneToMany,
} from '@mikro-orm/decorators/legacy';
import { NotAcceptableException } from '@nestjs/common';
import { BaseEntity } from '../common/base.entity';
import { Client, Type } from './client.entity';
import { Transit } from './transit.entity';
import { AwardedMiles } from './awarded-miles.entity';
import { AwardsAccountRepository } from '../repository/awards-account.repository';
import { ConstantUntil } from '../loyalty/miles/constant-until';
import { Miles, requireMilesAmount } from '../loyalty/miles/miles';

export interface SpendingContext {
  transitCount: number;
  claimCount: number;
  clientType: Type;
}

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
    transit: Transit,
    now: number,
  ): AwardedMiles | null {
    if (!this.isActive) return null;
    return this.addMiles(new ConstantUntil(amount, expiration), now, transit);
  }

  public addNonExpiringMiles(amount: number, now: number): AwardedMiles {
    return this.addMiles(ConstantUntil.forever(amount), now, null);
  }

  public calculateBalance(moment: number): number {
    return this.miles
      .getItems()
      .reduce((balance, grant) => balance + grant.getMilesAmount(moment), 0);
  }

  public remove(
    amount: number,
    moment: number,
    context: SpendingContext,
  ): void {
    requireMilesAmount(amount);
    if (!this.canSpend(amount, moment)) {
      throw new NotAcceptableException(
        'Insufficient miles or inactive account',
      );
    }
    const grants = [...this.miles.getItems()].sort(
      this.chooseStrategy(context, moment),
    );
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
    transit: Transit | null,
  ): AwardedMiles {
    const grant = new AwardedMiles(this, miles, now, transit);
    this.miles.add(grant);
    this.transactions++;
    return grant;
  }

  private chooseStrategy(context: SpendingContext, moment: number) {
    const byDate = (a: AwardedMiles, b: AwardedMiles) =>
      a.getDate() - b.getDate();
    const byExpiration = (a: AwardedMiles, b: AwardedMiles) =>
      a.getExpirationDate() - b.getExpirationDate();
    const nonExpiringLast = (a: AwardedMiles, b: AwardedMiles) =>
      Number(a.cantExpire()) - Number(b.cantExpire());
    if (context.claimCount >= 3)
      return (a: AwardedMiles, b: AwardedMiles) => byExpiration(b, a);
    const isSunday = new Date(moment).getDay() === 0;
    if (
      context.clientType === Type.VIP ||
      (context.transitCount >= 15 && isSunday)
    ) {
      return (a: AwardedMiles, b: AwardedMiles) =>
        nonExpiringLast(a, b) || byExpiration(a, b);
    }
    if (context.transitCount >= 15)
      return (a: AwardedMiles, b: AwardedMiles) =>
        nonExpiringLast(a, b) || byDate(a, b);
    return byDate;
  }
}
