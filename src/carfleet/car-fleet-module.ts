import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CarTypeService } from './car-type.service';
import { CarTypeController } from './car-type.controller';
import { CarType } from './car-type.entity';
import { CarTypeActiveCounter } from './car-type-active-counter.entity';
import { ConfigurationModule } from '../config/configuration-module';

@Module({
  imports: [
    ConfigurationModule,
    MikroOrmModule.forFeature([CarType, CarTypeActiveCounter]),
  ],
  providers: [CarTypeService],
  controllers: [CarTypeController],
  exports: [CarTypeService],
})
export class CarFleetModule {}
