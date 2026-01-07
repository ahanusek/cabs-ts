import { EntityRepository } from '@mikro-orm/postgresql';
import { CarClass, CarStatus, CarType } from '../entity/car-type.entity';
import { NotFoundException } from '@nestjs/common';

export class CarTypeRepository extends EntityRepository<CarType> {
  public async findByCarClass(carClass: CarClass): Promise<CarType> {
    const carType = await this.findOne({ carClass });

    if (!carType) {
      throw new NotFoundException('Cannot find car type');
    }
    return carType;
  }

  public async findByStatus(status: CarStatus): Promise<CarType[]> {
    return this.find({ status });
  }
}
