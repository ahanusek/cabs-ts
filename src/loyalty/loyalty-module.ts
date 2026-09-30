import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AwardsService } from './awards.service';
import { ClaimRefundedSubscriber } from './claim-refunded.subscriber';
import { AwardsAccountController } from './awards-account.controller';
import { AwardsAccount } from './awards-account.entity';
import { AwardedMiles } from './awarded-miles.entity';
import { ClientAccessModule } from '../crm/client-access-module';
import { ClaimsQueriesModule } from '../crm/claims/claims-queries-module';
import { TransitDetailsModule } from '../transitdetails/transit-details-module';
import { ConfigurationModule } from '../config/configuration-module';
import { DomainEventsModule } from '../common/domain-events-module';

@Module({
  imports: [
    ClientAccessModule,
    ClaimsQueriesModule,
    TransitDetailsModule,
    ConfigurationModule,
    DomainEventsModule,
    MikroOrmModule.forFeature([AwardsAccount, AwardedMiles]),
  ],
  providers: [AwardsService, ClaimRefundedSubscriber],
  controllers: [AwardsAccountController],
  exports: [AwardsService],
})
export class LoyaltyModule {}
