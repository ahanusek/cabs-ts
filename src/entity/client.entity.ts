import { BaseEntity } from '../common/base.entity';
import { Entity, Property, OneToMany, Collection, Enum } from '@mikro-orm/core';
import { Claim } from './claim.entity';
import { ClientRepository } from '../repository/client.repository';

export enum ClientType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}

export enum PaymentType {
  PRE_PAID = 'pre_paid',
  POST_PAID = 'post_paid',
  MONTHLY_INVOICE = 'monthly_invoice',
}

export enum Type {
  NORMAL = 'normal',
  VIP = 'vip',
}

@Entity({ repository: () => ClientRepository })
export class Client extends BaseEntity {
  @Enum(() => Type)
  private type!: Type;

  @Property()
  private name!: string;

  @Property()
  private lastName!: string;

  @Enum(() => PaymentType)
  private defaultPaymentType!: PaymentType;

  @Enum({ items: () => ClientType, default: ClientType.INDIVIDUAL })
  private clientType: ClientType = ClientType.INDIVIDUAL;

  @OneToMany(() => Claim, (claim) => claim.owner)
  public claims = new Collection<Claim>(this);

  public getClaims() {
    return this.claims.getItems();
  }

  public setClaims(claims: Claim[]) {
    this.claims.set(claims);
  }

  public getName() {
    return this.name;
  }

  public setName(name: string) {
    this.name = name;
  }

  public getLastName() {
    return this.lastName;
  }

  public setLastName(lastName: string) {
    this.lastName = lastName;
  }

  public getClientType() {
    return this.clientType;
  }

  public setClientType(clientType: ClientType) {
    this.clientType = clientType;
  }

  public getType() {
    return this.type;
  }

  public setType(type: Type) {
    this.type = type;
  }

  public getDefaultPaymentType() {
    return this.defaultPaymentType;
  }

  public setDefaultPaymentType(defaultPaymentType: PaymentType) {
    this.defaultPaymentType = defaultPaymentType;
  }
}
