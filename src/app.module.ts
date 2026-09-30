import { TransitDetails } from './transitdetails/transit-details.entity';
import { TransitDetailsFacade } from './transitdetails/transit-details.facade';
import { PopulateGraphService } from './transitanalyzer/populate-graph.service';
import { DomainEvents } from './common/domain-events';
import { GraphTransitSubscriber } from './transitanalyzer/graph-transit.subscriber';
import { CompletedTransitEdge } from './transitanalyzer/completed-transit-edge.entity';
import { GraphTransitAnalyzer } from './transitanalyzer/graph-transit-analyzer';
import { ContractsModule } from './contracts/contracts.module';
import { DocumentHeader } from './contracts/model/document-header.entity';
import { DocumentContent } from './contracts/model/document-content.entity';
import { RepairModule } from './repair/repair.module';
import { Party } from './party/party.entity';
import { PartyRelationship } from './party/party-relationship.entity';
import { TravelledDistance } from './driverreport/travelled-distance/travelled-distance.entity';
import { TravelledDistanceService } from './driverreport/travelled-distance/travelled-distance.service';
import { SqlDriverReportCreator } from './driverreport/sql-driver-report.creator';
import { ContractAttachmentData } from './entity/contract-attachment-data.entity';
import { ClaimsResolver } from './claims/claims-resolver.entity';
import { CarTypeActiveCounter } from './entity/car-type-active-counter.entity';
import { DriverFinder } from './service/driver-finder.service';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { DriverController } from './controllers/driver.controller';
import { DriverService } from './service/driver.service';
import { AppProperties } from './config/app-properties.config';
import { CarTypeController } from './controllers/car-type.controller';
import { CarTypeService } from './service/car-type.service';
import { DistanceCalculator } from './service/distance-calculator.service';
import { InvoiceGenerator } from './service/invoice-generator.service';
import { DriverNotificationService } from './service/driver-notification.service';
import { GeocodingService } from './service/geocoding.service';
import { ClaimNumberGenerator } from './service/claim-number-generator.service';
import { ClientNotificationService } from './service/client-notification.service';
import { ClientService } from './service/client.service';
import { ClientController } from './controllers/client.controller';
import { DriverSessionService } from './service/driver-session.service';
import { DriverSessionController } from './controllers/driver-session.controller';
import { DriverFeeService } from './service/driver-fee.service';
import { DriverTrackingService } from './service/driver-tracking.service';
import { DriverTrackingController } from './controllers/driver-tracking.controller';
import { AwardsService } from './service/awards.service';
import { ClaimService } from './service/claim.service';
import { ContractService } from './service/contract.service';
import { TransitService } from './service/transit.service';
import { TransitAnalyzerController } from './controllers/transit-analyzer.controller';
import { TransitController } from './controllers/transit.controller';
import { AwardsAccountController } from './controllers/awards-account.controller';
import { ClaimController } from './controllers/claim.controller';
import { ContractController } from './controllers/contract.controller';
import { DriverReportController } from './controllers/driver-report.controller';
import ormConfig from './mikro-orm.config';

import { Driver } from './entity/driver.entity';
import { CarType } from './entity/car-type.entity';
import { Client } from './entity/client.entity';
import { Transit } from './entity/transit.entity';
import { Address } from './entity/address.entity';
import { Claim } from './entity/claim.entity';
import { Contract } from './entity/contract.entity';
import { DriverFee } from './entity/driver-fee.entity';
import { DriverAttribute } from './entity/driver-attribute.entity';
import { DriverSession } from './entity/driver-session.entity';
import { DriverPosition } from './entity/driver-position.entity';
import { AwardsAccount } from './entity/awards-account.entity';
import { AwardedMiles } from './entity/awarded-miles.entity';
import { Invoice } from './entity/invoice.entity';
import { ClaimAttachment } from './entity/claim-attachment.entity';
import { ContractAttachment } from './entity/contract-attachment.entity';

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
    ContractsModule,
    RepairModule,
    ConfigModule.forRoot(),
    MikroOrmModule.forRoot({ ...ormConfig, entities }),
    MikroOrmModule.forFeature(entities),
  ],
  controllers: [
    DriverController,
    CarTypeController,
    ClientController,
    DriverSessionController,
    DriverTrackingController,
    TransitAnalyzerController,
    TransitController,
    AwardsAccountController,
    ClaimController,
    ContractController,
    DriverReportController,
  ],
  providers: [
    TransitDetailsFacade,
    PopulateGraphService,
    DomainEvents,
    GraphTransitSubscriber,
    GraphTransitAnalyzer,
    TravelledDistanceService,
    SqlDriverReportCreator,
    DriverFinder,
    AppProperties,
    DriverService,
    CarTypeService,
    DistanceCalculator,
    InvoiceGenerator,
    DriverNotificationService,
    GeocodingService,
    ClaimNumberGenerator,
    ClientNotificationService,
    ClientService,
    DriverSessionService,
    DriverFeeService,
    DriverTrackingService,
    AwardsService,
    ClaimService,
    ContractService,
    TransitService,
  ],
})
export class AppModule {}
