import { IsInt, IsLatitude, IsLongitude, IsUUID, Min } from 'class-validator';

export class CreateDriverPositionDto {
  @IsLatitude()
  public latitude: number;

  @IsLongitude()
  public longitude: number;

  @IsUUID()
  public driverId: string;

  @IsInt()
  @Min(0)
  public seenAt: number;
}
