import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { InvoiceRepository } from './invoice.repository';
import { Invoice } from './invoice.entity';

@Injectable()
export class InvoiceGenerator {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: InvoiceRepository,
  ) {}

  public async generate(amount: number, subjectName: string) {
    const invoice = new Invoice(amount, subjectName);
    await this.invoiceRepository.getEntityManager().persist(invoice).flush();
    return invoice;
  }
}
