import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateDriverPositionDto {
  @IsNumber()
  public latitude: number;

  @IsNumber()
  public longitude: number;

  @IsNotEmpty()
  public driverId: string;
}
