import { RequestTransitService } from './request-transit.service';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TransitService } from './transit.service';
import { RideStore } from './ride-store';
import { TransitController } from './transit.controller';
import { RequestForTransit } from './request-for-transit.entity';
import { TransitDemand } from './transit-demand.entity';
import { Transit } from './transit.entity';
import { ClientAccessModule } from '../crm/client-access-module';
import { DriverFleetModule } from '../driverfleet/driver-fleet-module';
import { LoyaltyModule } from '../loyalty/loyalty-module';
import { InvoicingModule } from '../invoicing/invoicing-module';
import { AssignmentModule } from '../assignment/assignment-module';
import { GeolocationModule } from '../geolocation/geolocation-module';
import { DomainEventsModule } from '../common/domain-events-module';
import { TransitDetailsModule } from './details/transit-details-module';

@Module({
  imports: [
    ClientAccessModule,
    DriverFleetModule,
    LoyaltyModule,
    InvoicingModule,
    AssignmentModule,
    GeolocationModule,
    DomainEventsModule,
    TransitDetailsModule,
    MikroOrmModule.forFeature([RequestForTransit, TransitDemand, Transit]),
  ],
  providers: [RequestTransitService, TransitService, RideStore],
  controllers: [TransitController],
  exports: [TransitService],
})
export class RideModule {}
