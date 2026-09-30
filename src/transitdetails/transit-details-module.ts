import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TransitDetailsFacade } from './transit-details.facade';
import { TransitDetails } from './transit-details.entity';

@Module({
  imports: [MikroOrmModule.forFeature([TransitDetails])],
  providers: [TransitDetailsFacade],
  controllers: [],
  exports: [TransitDetailsFacade],
})
export class TransitDetailsModule {}
