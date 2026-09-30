import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { GeocodingService } from './geocoding.service';
import { DistanceCalculator } from './distance-calculator.service';
import { Address } from './address/address.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Address])],
  providers: [GeocodingService, DistanceCalculator],
  controllers: [],
  exports: [GeocodingService, DistanceCalculator],
})
export class GeolocationModule {}
