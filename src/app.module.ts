import { TrackingModule } from './tracking/tracking-module';
import { DriverReportModule } from './driverfleet/driverreport/driver-report-module';
import { TransitAnalysisModule } from './crm/transitanalyzer/transit-analysis-module';
import { ClaimsModule } from './crm/claims/claims-module';
import { GeolocationModule } from './geolocation/geolocation-module';
import { LoyaltyModule } from './loyalty/loyalty-module';
import { ClaimsQueriesModule } from './crm/claims/claims-queries-module';
import { ClientAccessModule } from './crm/client-access-module';
import { DriverFleetModule } from './driverfleet/driver-fleet-module';
import { TransitDetailsModule } from './transitdetails/transit-details-module';
import { DomainEventsModule } from './common/domain-events-module';
import { NotificationModule } from './notification/notification-module';
import { InvoicingModule } from './invoicing/invoicing-module';
import { CarFleetModule } from './carfleet/car-fleet-module';
import { ConfigurationModule } from './config/configuration-module';
import { AgreementsModule } from './agreements/agreements-module';

import { TransitDetails } from './transitdetails/transit-details.entity';

import { CompletedTransitEdge } from './crm/transitanalyzer/completed-transit-edge.entity';

import { ContractsModule } from './contracts/contracts.module';
import { DocumentHeader } from './contracts/model/document-header.entity';
import { DocumentContent } from './contracts/model/document-content.entity';
import { RepairModule } from './repair/repair.module';
import { Party } from './party/party.entity';
import { PartyRelationship } from './party/party-relationship.entity';
import { TravelledDistance } from './driverfleet/driverreport/travelled-distance/travelled-distance.entity';

import { ContractAttachmentData } from './agreements/contract-attachment-data.entity';
import { ClaimsResolver } from './crm/claims/claims-resolver.entity';
import { CarTypeActiveCounter } from './carfleet/car-type-active-counter.entity';
import { DriverFinder } from './service/driver-finder.service';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';

import { TransitService } from './service/transit.service';

import { TransitController } from './controllers/transit.controller';

import ormConfig from './mikro-orm.config';

import { Driver } from './driverfleet/driver.entity';
import { CarType } from './carfleet/car-type.entity';
import { Client } from './crm/client.entity';
import { Transit } from './entity/transit.entity';
import { Address } from './geolocation/address/address.entity';
import { Claim } from './crm/claims/claim.entity';
import { Contract } from './agreements/contract.entity';
import { DriverFee } from './driverfleet/driver-fee.entity';
import { DriverAttribute } from './driverfleet/driver-attribute.entity';
import { DriverSession } from './tracking/driver-session.entity';
import { DriverPosition } from './tracking/driver-position.entity';
import { AwardsAccount } from './loyalty/awards-account.entity';
import { AwardedMiles } from './loyalty/awarded-miles.entity';
import { Invoice } from './invoicing/invoice.entity';
import { ClaimAttachment } from './crm/claims/claim-attachment.entity';
import { ContractAttachment } from './agreements/contract-attachment.entity';

const entities = [
  TransitDetails,
  CompletedTransitEdge,
  DocumentHeader,
  DocumentContent,
  Party,
  PartyRelationship,
  TravelledDistance,
  ContractAttachmentData,
  ClaimsResolver,
  CarTypeActiveCounter,
  Driver,
  CarType,
  Client,
  Transit,
  Address,
  Claim,
  Contract,
  DriverFee,
  DriverAttribute,
  DriverSession,
  DriverPosition,
  AwardsAccount,
  AwardedMiles,
  Invoice,
  ClaimAttachment,
  ContractAttachment,
];

@Module({
  imports: [
    TrackingModule,
    DriverReportModule,
    TransitAnalysisModule,
    ClaimsModule,
    GeolocationModule,
    LoyaltyModule,
    ClaimsQueriesModule,
    ClientAccessModule,
    DriverFleetModule,
    TransitDetailsModule,
    DomainEventsModule,
    NotificationModule,
    InvoicingModule,
    CarFleetModule,
    ConfigurationModule,
    AgreementsModule,
    ContractsModule,
    RepairModule,
    ConfigModule.forRoot(),
    MikroOrmModule.forRoot({ ...ormConfig, entities }),
    MikroOrmModule.forFeature(entities),
  ],
  controllers: [TransitController],
  providers: [DriverFinder, TransitService],
})
export class AppModule {}
