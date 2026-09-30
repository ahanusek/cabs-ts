import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DriverTrackingService } from './driver-tracking.service';
import { DriverPositionDto } from './driver-position.dto';
import { CreateDriverPositionDto } from './create-driver-position.dto';
import { DriverPosition } from './driver-position.entity';

@Controller('driverPositions')
export class DriverTrackingController {
  constructor(private readonly trackingService: DriverTrackingService) {}

  @Post()
  @UsePipes(ValidationPipe)
  public async create(
    @Body() createDriverPositionDto: CreateDriverPositionDto,
  ): Promise<DriverPositionDto> {
    const driverPosition = await this.trackingService.registerPosition(
      createDriverPositionDto.driverId,
      createDriverPositionDto.latitude,
      createDriverPositionDto.longitude,
      createDriverPositionDto.seenAt,
    );

    return this.toDto(driverPosition);
  }

  @Get(':driverId/total')
  public async calculateTravelledDistance(
    @Param('driverId') driverId: string,
    @Body() params: { from: number; to: number },
  ): Promise<number> {
    return (
      await this.trackingService.calculateTravelledDistance(
        driverId,
        params.from,
        params.to,
      )
    ).toKm();
  }

  private toDto(driverPosition: DriverPosition) {
    return new DriverPositionDto(
      driverPosition.getDriverId(),
      driverPosition.getLatitude(),
      driverPosition.getLongitude(),
      driverPosition.getSeenAt(),
    );
  }
}
