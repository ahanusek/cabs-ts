import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ClaimService } from './claim.service';
import { ClaimNumberGenerator } from './claim-number-generator.service';
import { ClaimController } from './claim.controller';
import { Claim } from './claim.entity';
import { ClaimsResolver } from './claims-resolver.entity';
import { ClaimAttachment } from './claim-attachment.entity';
import { ClientAccessModule } from '../client-access.module';
import { TransitDetailsModule } from '../../ride/details/transit-details.module';
import { ConfigurationModule } from '../../config/configuration.module';
import { NotificationModule } from '../../notification/notification.module';
import { DomainEventsModule } from '../../common/domain-events.module';

@Module({
  imports: [
    ClientAccessModule,
    TransitDetailsModule,
    ConfigurationModule,
    NotificationModule,
    DomainEventsModule,
    MikroOrmModule.forFeature([Claim, ClaimsResolver, ClaimAttachment]),
  ],
  providers: [ClaimService, ClaimNumberGenerator],
  controllers: [ClaimController],
  exports: [ClaimService, ClaimNumberGenerator],
})
export class ClaimsModule {}
