import { BaseEntity } from '../common/base.entity';
import { Entity, Property } from '@mikro-orm/core';
import { InvoiceRepository } from '../repository/invoice.repository';

@Entity({ repository: () => InvoiceRepository })
export class Invoice extends BaseEntity {
  @Property()
  private amount!: number;

  @Property()
  private subjectName!: string;

  constructor(amount?: number, subjectName?: string) {
    super();
    if (amount) this.amount = amount;
    if (subjectName) this.subjectName = subjectName;
  }
}
