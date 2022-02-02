import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DriverController } from './controllers/driver.controller';
import { DriverService } from './service/driver.service';
import { DriverRepository } from './repository/driver.repository';
import { AppProperties } from './config/app-properties.config';
import { CarTypeRepository } from './repository/car-type.repository';
import { CarTypeController } from './controllers/car-type.controller';
import { CarTypeService } from './service/car-type.service';
import { DriverAttribute } from './entity/driver-attribute.entity';
import { Address } from './entity/address.entity';
import { Client } from './entity/client.entity';
import { Claim } from './entity/claim.entity';
import { DistanceCalculator } from './service/distance-calculator.service';
import { InvoiceRepository } from './repository/invoice.repository';
import { InvoiceGenerator } from './service/invoice-generator.service';
import { DriverNotificationService } from './service/driver-notification.service';
import { GeocodingService } from './service/geocoding.service';
import { ClaimNumberGenerator } from './service/claim-number-generator.service';
import { ClaimRepository } from './repository/claim.repository';
import { ClientNotificationService } from './service/client-notification.service';
import { ClientService } from './service/client.service';
import { ClientRepository } from './repository/client.repository';
import { ClientController } from './controllers/client.controller';
import { DriverSessionService } from './service/driver-session.service';
import { DriverSessionRepository } from './repository/driver-session.repository';
import { DriverSessionController } from './controllers/driver-session.controller';
import { DriverFeeRepository } from './repository/driver-fee.repository';
import { TransitRepository } from './repository/transit.repository';
import { DriverFeeService } from './service/driver-fee.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: process.env.DATABASE_PORT
        ? parseInt(process.env.DATABASE_PORT, 10)
        : 3456,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      DriverRepository,
      CarTypeRepository,
      InvoiceRepository,
      ClaimRepository,
      ClientRepository,
      DriverSessionRepository,
      DriverFeeRepository,
      TransitRepository,
      DriverAttribute,
      Address,
      Client,
      Claim,
    ]),
  ],
  controllers: [
    DriverController,
    CarTypeController,
    ClientController,
    DriverSessionController,
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
  ],
})
export class AppModule {}
