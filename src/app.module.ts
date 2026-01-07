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
import { TransitAnalyzerService } from './service/transit-analyzer.service';
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
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

// Import entities
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
    ConfigModule.forRoot(),
    MikroOrmModule.forRoot({
      driver: PostgreSqlDriver,
      host: process.env.DATABASE_HOST || 'localhost',
      port: process.env.DATABASE_PORT
        ? parseInt(process.env.DATABASE_PORT, 10)
        : 5432,
      user: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      dbName: process.env.DATABASE_NAME || 'cabs',
      entities: entities,
      debug: process.env.NODE_ENV !== 'production',
      allowGlobalContext: true,
      schemaGenerator: {
        disableForeignKeys: true,
        createForeignKeyConstraints: true,
      },
    }),
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
    TransitAnalyzerService,
    AwardsService,
    ClaimService,
    ContractService,
    TransitService,
  ],
})
export class AppModule {}
