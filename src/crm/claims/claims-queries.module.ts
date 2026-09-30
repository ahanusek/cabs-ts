import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ClaimsQueries } from './claims-queries';
import { Claim } from './claim.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Claim])],
  providers: [ClaimsQueries],
  controllers: [],
  exports: [ClaimsQueries],
})
export class ClaimsQueriesModule {}
