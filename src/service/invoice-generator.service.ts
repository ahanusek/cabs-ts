import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { InvoiceRepository } from '../repository/invoice.repository';
import { Invoice } from '../entity/invoice.entity';

@Injectable()
export class InvoiceGenerator {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: InvoiceRepository,
  ) {}

  public async generate(amount: number, subjectName: string) {
    const invoice = new Invoice(amount, subjectName);
    await this.invoiceRepository.getEntityManager().persistAndFlush(invoice);
    return invoice;
  }
}
