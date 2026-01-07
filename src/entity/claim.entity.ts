import { BaseEntity } from '../common/base.entity';
import { Client } from './client.entity';
import { Entity, Property, ManyToOne, OneToOne, Enum } from '@mikro-orm/core';
import { Transit } from './transit.entity';
import { ClaimRepository } from '../repository/claim.repository';

export enum ClaimStatus {
  DRAFT = 'draft',
  NEW = 'new',
  IN_PROCESS = 'in_process',
  REFUNDED = 'refunded',
  ESCALATED = 'escalated',
  REJECTED = 'rejected',
}

export enum CompletionMode {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
}

@Entity({ repository: () => ClaimRepository })
export class Claim extends BaseEntity {
  @ManyToOne(() => Client)
  public owner!: Client;

  @OneToOne(() => Transit, { owner: true })
  public transit!: Transit;

  @Property({ type: 'bigint' })
  public creationDate!: number;

  @Property({ nullable: true, type: 'bigint' })
  public completionDate: number | null = null;

  @Property({ nullable: true, type: 'bigint' })
  public changeDate: number | null = null;

  @Property()
  public reason!: string;

  @Property({ nullable: true, type: 'varchar' })
  public incidentDescription: string | null = null;

  @Enum({ items: () => CompletionMode, nullable: true })
  public completionMode: CompletionMode | null = null;

  @Enum(() => ClaimStatus)
  public status!: ClaimStatus;

  @Property()
  public claimNo!: string;

  public getClaimNo() {
    return this.claimNo;
  }

  public setClaimNo(claimNo: string) {
    this.claimNo = claimNo;
  }

  public getOwner() {
    return this.owner;
  }

  public setOwner(owner: Client) {
    this.owner = owner;
  }

  public getTransit() {
    return this.transit;
  }

  public setTransit(transit: Transit) {
    this.transit = transit;
  }

  public getCreationDate() {
    return this.creationDate;
  }

  public setCreationDate(creationDate: number) {
    this.creationDate = creationDate;
  }

  public getCompletionDate() {
    return this.completionDate;
  }

  public setCompletionDate(completionDate: number) {
    this.completionDate = completionDate;
  }

  public getIncidentDescription() {
    return this.incidentDescription;
  }

  public setIncidentDescription(incidentDescription: string | null) {
    this.incidentDescription = incidentDescription;
  }

  public getCompletionMode() {
    return this.completionMode;
  }

  public setCompletionMode(completionMode: CompletionMode) {
    this.completionMode = completionMode;
  }

  public getStatus() {
    return this.status;
  }

  public setStatus(status: ClaimStatus) {
    this.status = status;
  }

  public getChangeDate() {
    return this.changeDate;
  }

  public setChangeDate(changeDate: number) {
    this.changeDate = changeDate;
  }

  public getReason() {
    return this.reason;
  }

  public setReason(reason: string) {
    this.reason = reason;
  }
}
