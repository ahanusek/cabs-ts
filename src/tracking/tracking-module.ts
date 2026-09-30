import { TrackingQueries } from './tracking-queries';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DriverSessionService } from './driver-session.service';
import { DriverTrackingService } from './driver-tracking.service';
import { DriverSessionController } from './driver-session.controller';
import { DriverTrackingController } from './driver-tracking.controller';
import { DriverSession } from './driver-session.entity';
import { DriverPosition } from './driver-position.entity';
import { DriverFleetModule } from '../driverfleet/driver-fleet-module';
import { DriverReportModule } from '../driverfleet/driverreport/driver-report-module';
import { CarFleetModule } from '../carfleet/car-fleet-module';

@Module({
  imports: [
    DriverFleetModule,
    DriverReportModule,
    CarFleetModule,
    MikroOrmModule.forFeature([DriverSession, DriverPosition]),
  ],
  providers: [TrackingQueries, DriverSessionService, DriverTrackingService],
  controllers: [DriverSessionController, DriverTrackingController],
  exports: [TrackingQueries, DriverSessionService, DriverTrackingService],
})
export class TrackingModule {}
