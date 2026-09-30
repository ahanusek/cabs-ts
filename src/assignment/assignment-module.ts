import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DriverAssignmentFacade } from './driver-assignment.facade';
import { DriverFinder } from './driver-finder.service';
import { DriverAssignment } from './driver-assignment.entity';
import { TrackingModule } from '../tracking/tracking-module';
import { DriverFleetModule } from '../driverfleet/driver-fleet-module';
import { CarFleetModule } from '../carfleet/car-fleet-module';
import { GeolocationModule } from '../geolocation/geolocation-module';
import { NotificationModule } from '../notification/notification-module';

@Module({
  imports: [
    TrackingModule,
    DriverFleetModule,
    CarFleetModule,
    GeolocationModule,
    NotificationModule,
    MikroOrmModule.forFeature([DriverAssignment]),
  ],
  providers: [DriverAssignmentFacade, DriverFinder],
  controllers: [],
  exports: [DriverAssignmentFacade],
})
export class AssignmentModule {}
