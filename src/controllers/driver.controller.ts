import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DriverService } from '../service/driver.service';
import { CreateDriverDto } from '../dto/create-driver.dto';
import { DriverDto } from '../dto/driver.dto';

@Controller('drivers')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  @UsePipes(ValidationPipe)
  public async createDriver(
    @Body() createDriverDto: CreateDriverDto,
  ): Promise<DriverDto> {
    const driver = await this.driverService.createDriver(createDriverDto);

    return this.driverService.loadDriver(driver.getId());
  }
}
