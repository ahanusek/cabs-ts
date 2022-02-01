import { IsEnum } from 'class-validator';
import { CarClass } from '../models/car-type.model';

export class CreateCarTypeDto {
  public description: string;

  @IsEnum(CarClass)
  public carClass: CarClass;
}
