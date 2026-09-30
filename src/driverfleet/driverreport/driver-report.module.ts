import { GeolocationModule } from '../../geolocation/geolocation.module';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SqlDriverReportCreator } from './sql-driver-report.creator';
import { TravelledDistanceService } from './travelled-distance/travelled-distance.service';
import { DriverReportController } from './driver-report.controller';
import { TravelledDistance } from './travelled-distance/travelled-distance.entity';

@Module({
  imports: [GeolocationModule, MikroOrmModule.forFeature([TravelledDistance])],
  providers: [SqlDriverReportCreator, TravelledDistanceService],
  controllers: [DriverReportController],
  exports: [SqlDriverReportCreator, TravelledDistanceService],
})
export class DriverReportModule {}
