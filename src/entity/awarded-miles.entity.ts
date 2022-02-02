import { BaseEntity } from '../common/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Client } from './client.entity';
import { Transit } from './transit.entity';

@Entity()
export class AwardedMiles extends BaseEntity {
  // Aggregate
  // 1. mile celowo są osobno, aby się mogło rozjechać na ich wydawaniu -> docelowo: kolekcja VOs w agregacie
  // VO
  // 1. miles + expirationDate -> VO przykrywające logikę walidacji, czy nie przekroczono daty ważności punktów
  // 2. wydzielenie interfejsu Miles -> różne VO z różną logiką, np. ExpirableMiles, NonExpirableMiles, LinearExpirableMiles

  @ManyToOne(() => Client)
  public client: Client;

  @Column()
  private miles: number;

  @Column({ default: Date.now() })
  private date: number;

  @Column()
  private expirationDate: number;

  @Column()
  private isSpecial: boolean;

  @ManyToOne(() => Transit)
  public transit: Transit;

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

  public setTransit(transit: Transit) {
    this.transit = transit;
  }
}
