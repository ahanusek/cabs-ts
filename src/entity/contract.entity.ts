import { BaseEntity } from '../common/base.entity';
import { Collection } from '@mikro-orm/core';
import {
  Entity,
  Property,
  OneToMany,
  Enum,
} from '@mikro-orm/decorators/legacy';
import { ContractAttachment } from './contract-attachment.entity';
import { ContractRepository } from '../repository/contract.repository';

export enum ContractStatus {
  NEGOTIATIONS_IN_PROGRESS = 'negotiations_in_progress',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted',
}

@Entity({ repository: () => ContractRepository })
export class Contract extends BaseEntity {
  @OneToMany(
    () => ContractAttachment,
    (contractAttachment) => contractAttachment.contract,
    { eager: true },
  )
  public attachments = new Collection<ContractAttachment>(this);

  @Property()
  public partnerName!: string;

  @Property()
  public subject!: string;

  @Property({ type: 'bigint', runtimeType: 'number' })
  public creationDate: number = Date.now();

  @Property({ nullable: true, type: 'bigint', runtimeType: 'number' })
  public acceptedAt: number | null = null;

  @Property({ nullable: true, type: 'bigint', runtimeType: 'number' })
  public rejectedAt: number | null = null;

  @Property({ nullable: true, type: 'bigint', runtimeType: 'number' })
  public changeDate: number | null = null;

  @Enum({
    items: () => ContractStatus,
    default: ContractStatus.NEGOTIATIONS_IN_PROGRESS,
  })
  public status: ContractStatus = ContractStatus.NEGOTIATIONS_IN_PROGRESS;

  @Property()
  public contractNo!: string;

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

  public setStatus(status: ContractStatus) {
    this.status = status;
  }

  public getContractNo() {
    return this.contractNo;
  }

  public setContractNo(contractNo: string) {
    this.contractNo = contractNo;
  }

  public getAttachments() {
    return this.attachments.getItems();
  }

  public setAttachments(attachments: ContractAttachment[]) {
    this.attachments.set(attachments);
  }

  public getPartnerName() {
    return this.partnerName;
  }

  public setPartnerName(partnerName: string) {
    this.partnerName = partnerName;
  }

  public getSubject() {
    return this.subject;
  }

  public setSubject(subject: string) {
    this.subject = subject;
  }
}
