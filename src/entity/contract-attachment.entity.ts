import { BaseEntity } from '../common/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Contract } from './contract.entity';

export enum ContractAttachmentStatus {
  PROPOSED = 'proposed',
  ACCEPTED_BY_ONE_SIDE = 'accepted_by_one_side',
  ACCEPTED_BY_BOTH_SIDES = 'accepted_by_both_side',
  REJECTED = 'rejected',
}

@Entity()
export class ContractAttachment extends BaseEntity {
  @ManyToOne(() => Contract, (contract) => contract.attachments)
  public contract: Contract;

  @Column({ type: 'blob' })
  private data: Blob;

  @Column({ default: Date.now() })
  private creationDate: number;

  @Column()
  private acceptedAt: number;

  @Column()
  private rejectedAt: number;

  @Column()
  private changeDate: number;

  @Column({ default: ContractAttachmentStatus.PROPOSED })
  private status: ContractAttachmentStatus;

  public getData() {
    return this.data;
  }

  public setData(data: Blob) {
    this.data = data;
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
