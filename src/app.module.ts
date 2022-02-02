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
import { DriverFee } from './entity/driver-fee.entity';
import { DriverAttribute } from './entity/driver-attribute.entity';
import { Transit } from './entity/transit.entity';
import { Address } from './entity/address.entity';
import { Client } from './entity/client.entity';
import { Claim } from './entity/claim.entity';

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
      DriverFee,
      DriverAttribute,
      Transit,
      Address,
      Client,
      Claim,
    ]),
  ],
  controllers: [DriverController, CarTypeController],
  providers: [AppProperties, DriverService, CarTypeService],
})
export class AppModule {}
