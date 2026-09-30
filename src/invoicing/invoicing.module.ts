import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { InvoiceGenerator } from './invoice-generator.service';
import { Invoice } from './invoice.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Invoice])],
  providers: [InvoiceGenerator],
  controllers: [],
  exports: [InvoiceGenerator],
})
export class InvoicingModule {}
