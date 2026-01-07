import { EntityRepository } from '@mikro-orm/postgresql';
import { Invoice } from '../entity/invoice.entity';

export class InvoiceRepository extends EntityRepository<Invoice> {}
