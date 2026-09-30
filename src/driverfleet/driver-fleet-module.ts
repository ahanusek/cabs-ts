import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DriverService } from './driver.service';
import { DriverFeeService } from './driver-fee.service';
import { DriverController } from './driver.controller';
import { Driver } from './driver.entity';
import { DriverFee } from './driver-fee.entity';
import { DriverAttribute } from './driver-attribute.entity';
import { TransitDetailsModule } from '../ride/details/transit-details-module';

@Module({
  imports: [
    TransitDetailsModule,
    MikroOrmModule.forFeature([Driver, DriverFee, DriverAttribute]),
  ],
  providers: [DriverService, DriverFeeService],
  controllers: [DriverController],
  exports: [DriverService, DriverFeeService],
})
export class DriverFleetModule {}
