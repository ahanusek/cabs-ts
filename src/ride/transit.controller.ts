import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TransitService } from './transit.service';
import type { TransitView } from './details/transit-view';
import { CreateAddressDto } from '../geolocation/address/create-address.dto';
import { AddressDto } from '../geolocation/address/address.dto';
import { CreateTransitDto } from './create-transit.dto';

@Controller('transits')
export class TransitController {
  constructor(private readonly transitService: TransitService) {}

  @Get(':transitId')
  public async getTransit(
    @Param('transitId') transitId: string,
  ): Promise<TransitView> {
    return this.transitService.loadTransit(transitId);
  }

  @Post()
  public async createTransit(
    @Body() createTransitDto: CreateTransitDto,
  ): Promise<TransitView> {
    const transit = await this.transitService.createTransit(createTransitDto);
    return this.transitService.loadTransit(transit.getId());
  }

  @Post(':transitId/changeAddressTo')
  public async changeAddressTo(
    @Param('transitId') transitId: string,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<TransitView> {
    await this.transitService.changeTransitAddressTo(
      transitId,
      new AddressDto(createAddressDto),
    );
    return this.transitService.loadTransit(transitId);
  }

  @Post(':transitId/changeAddressFrom')
  public async changeAddressFrom(
    @Param('transitId') transitId: string,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<TransitView> {
    await this.transitService.changeTransitAddressFrom(
      transitId,
      new AddressDto(createAddressDto),
    );
    return this.transitService.loadTransit(transitId);
  }

  @Post(':transitId/cancel')
  public async cancel(
    @Param('transitId') transitId: string,
  ): Promise<TransitView> {
    await this.transitService.cancelTransit(transitId);
    return this.transitService.loadTransit(transitId);
  }

  @Post(':transitId/publish')
  public async publishTransit(
    @Param('transitId') transitId: string,
  ): Promise<TransitView> {
    await this.transitService.publishTransit(transitId);
    return this.transitService.loadTransit(transitId);
  }

  @Post(':transitId/findDrivers')
  public async findDriversForTransit(
    @Param('transitId') transitId: string,
  ): Promise<TransitView> {
    await this.transitService.findDriversForTransit(transitId);
    return this.transitService.loadTransit(transitId);
  }

  @Post(':transitId/accept/:driverId')
  public async acceptTransit(
    @Param('transitId') transitId: string,
    @Param('driverId') driverId: string,
  ): Promise<TransitView> {
    await this.transitService.acceptTransit(driverId, transitId);
    return this.transitService.loadTransit(transitId);
  }

  @Post(':transitId/start/:driverId')
  public async start(
    @Param('transitId') transitId: string,
    @Param('driverId') driverId: string,
  ): Promise<TransitView> {
    await this.transitService.startTransit(driverId, transitId);
    return this.transitService.loadTransit(transitId);
  }

  @Post(':transitId/reject/:driverId')
  public async reject(
    @Param('transitId') transitId: string,
    @Param('driverId') driverId: string,
  ): Promise<TransitView> {
    await this.transitService.rejectTransit(driverId, transitId);
    return this.transitService.loadTransit(transitId);
  }

  @Post(':transitId/complete/:driverId')
  public async complete(
    @Param('transitId') transitId: string,
    @Param('driverId') driverId: string,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<TransitView> {
    await this.transitService.completeTransitFromDto(
      driverId,
      transitId,
      new AddressDto(createAddressDto),
    );
    return this.transitService.loadTransit(transitId);
  }
}
