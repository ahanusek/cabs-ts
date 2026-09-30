import { EntityRepository } from '@mikro-orm/postgresql';
import { Invoice } from './invoice.entity';

export class InvoiceRepository extends EntityRepository<Invoice> {}
