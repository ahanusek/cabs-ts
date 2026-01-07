import { BaseEntity } from '../common/base.entity';
import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { Contract } from './contract.entity';
import { ContractAttachmentRepository } from '../repository/contract-attachment.repository';

export enum ContractAttachmentStatus {
  PROPOSED = 'proposed',
  ACCEPTED_BY_ONE_SIDE = 'accepted_by_one_side',
  ACCEPTED_BY_BOTH_SIDES = 'accepted_by_both_side',
  REJECTED = 'rejected',
}

@Entity({ repository: () => ContractAttachmentRepository })
export class ContractAttachment extends BaseEntity {
  @ManyToOne(() => Contract, { inversedBy: 'attachments' })
  public contract!: Contract;

  @Property({ type: 'blob' })
  private data!: Buffer;

  @Property({ type: 'bigint' })
  private creationDate: number = Date.now();

  @Property({ nullable: true, type: 'bigint' })
  private acceptedAt: number | null = null;

  @Property({ nullable: true, type: 'bigint' })
  private rejectedAt: number | null = null;

  @Property({ nullable: true, type: 'bigint' })
  private changeDate?: number;

  @Enum({ items: () => ContractAttachmentStatus, default: ContractAttachmentStatus.PROPOSED })
  private status: ContractAttachmentStatus = ContractAttachmentStatus.PROPOSED;

  public getData() {
    return this.data;
  }

  public setData(data: string) {
    this.data = Buffer.from(
      '\\x' + Buffer.from(data, 'base64').toString('hex'),
    );
  }

  public getCreationDate() {
    return this.creationDate;
  }

  public setCreationDate(creationDate: number) {
    this.creationDate = creationDate;
  }

  public getAcceptedAt() {
    return this.acceptedAt;
  }

  public setAcceptedAt(acceptedAt: number) {
    this.acceptedAt = acceptedAt;
  }

  public getRejectedAt() {
    return this.rejectedAt;
  }

  public setRejectedAt(rejectedAt: number) {
    this.rejectedAt = rejectedAt;
  }

  public getChangeDate() {
    return this.changeDate;
  }

  public setChangeDate(changeDate: number) {
    this.changeDate = changeDate;
  }

  public getStatus() {
    return this.status;
  }

  public setStatus(status: ContractAttachmentStatus) {
    this.status = status;
  }

  public getContract() {
    return this.contract;
  }

  public setContract(contract: Contract) {
    this.contract = contract;
  }
}
