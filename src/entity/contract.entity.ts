import { Collection } from '@mikro-orm/core';
import {
  Entity,
  Property,
  OneToMany,
  Enum,
} from '@mikro-orm/decorators/legacy';
import { NotAcceptableException, NotFoundException } from '@nestjs/common';
import { BaseEntity } from '../common/base.entity';
import {
  ContractAttachment,
  ContractAttachmentStatus,
} from './contract-attachment.entity';
import { ContractRepository } from '../repository/contract.repository';

export enum ContractStatus {
  NEGOTIATIONS_IN_PROGRESS = 'negotiations_in_progress',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted',
}

@Entity({ repository: () => ContractRepository })
export class Contract extends BaseEntity {
  @OneToMany(() => ContractAttachment, (attachment) => attachment.contract, {
    eager: true,
    orphanRemoval: true,
  })
  private attachments = new Collection<ContractAttachment>(this);

  @Property()
  public partnerName: string;

  @Property()
  private subject: string;

  @Property({ type: 'bigint', runtimeType: 'number' })
  private creationDate = Date.now();

  @Property({ nullable: true, type: 'bigint', runtimeType: 'number' })
  private acceptedAt: number | null = null;

  @Property({ nullable: true, type: 'bigint', runtimeType: 'number' })
  private rejectedAt: number | null = null;

  @Property({ nullable: true, type: 'bigint', runtimeType: 'number' })
  private changeDate: number | null = null;

  @Enum({
    items: () => ContractStatus,
    default: ContractStatus.NEGOTIATIONS_IN_PROGRESS,
  })
  private status = ContractStatus.NEGOTIATIONS_IN_PROGRESS;

  @Property()
  private contractNo: string;

  constructor(partnerName: string, subject: string, contractNo: string) {
    super();
    this.partnerName = partnerName;
    this.subject = subject;
    this.contractNo = contractNo;
  }

  public proposeAttachment(data: string): ContractAttachment {
    const attachment = new ContractAttachment();
    attachment.setContract(this);
    attachment.setData(data);
    this.attachments.add(attachment);
    return attachment;
  }

  public accept(moment: number): void {
    if (
      this.attachments
        .getItems()
        .some(
          (attachment) =>
            attachment.getStatus() !==
            ContractAttachmentStatus.ACCEPTED_BY_BOTH_SIDES,
        )
    ) {
      throw new NotAcceptableException(
        'Not all attachments accepted by both sides',
      );
    }
    this.status = ContractStatus.ACCEPTED;
    this.acceptedAt = moment;
    this.changeDate = moment;
  }

  public reject(moment: number): void {
    this.status = ContractStatus.REJECTED;
    this.rejectedAt = moment;
    this.changeDate = moment;
  }

  public acceptAttachment(id: string, moment: number): void {
    const attachment = this.findAttachment(id);
    const status = attachment.getStatus();
    attachment.setStatus(
      status === ContractAttachmentStatus.ACCEPTED_BY_ONE_SIDE ||
        status === ContractAttachmentStatus.ACCEPTED_BY_BOTH_SIDES
        ? ContractAttachmentStatus.ACCEPTED_BY_BOTH_SIDES
        : ContractAttachmentStatus.ACCEPTED_BY_ONE_SIDE,
    );
    attachment.setAcceptedAt(moment);
  }

  public rejectAttachment(id: string, moment: number): void {
    const attachment = this.findAttachment(id);
    attachment.setStatus(ContractAttachmentStatus.REJECTED);
    attachment.setRejectedAt(moment);
  }

  public removeAttachment(id: string): void {
    this.attachments.remove(this.findAttachment(id));
  }

  public getCreationDate() {
    return this.creationDate;
  }
  public getAcceptedAt() {
    return this.acceptedAt;
  }
  public getRejectedAt() {
    return this.rejectedAt;
  }
  public getChangeDate() {
    return this.changeDate;
  }
  public getStatus() {
    return this.status;
  }
  public getContractNo() {
    return this.contractNo;
  }
  public getPartnerName() {
    return this.partnerName;
  }
  public getSubject() {
    return this.subject;
  }
  public getAttachments(): readonly ContractAttachment[] {
    return [...this.attachments.getItems()];
  }

  private findAttachment(id: string): ContractAttachment {
    const attachment = this.attachments
      .getItems()
      .find((item) => item.id === id);
    if (!attachment)
      throw new NotFoundException(
        'Attachment does not belong to this contract',
      );
    return attachment;
  }
}
