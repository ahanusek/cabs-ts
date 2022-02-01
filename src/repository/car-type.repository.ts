import { EntityRepository, Repository } from 'typeorm';
import { CarType } from '../entity/car-type.entity';
import { CarClass, CarStatus } from '../models/car-type.model';

@EntityRepository(CarType)
export class CarTypeRepository extends Repository<CarType> {
  public async findByCarClass(carClass: CarClass): Promise<CarType> {
    return this.findOne({ where: { carClass } });
  }

  public async findByStatus(status: CarStatus): Promise<CarType[]> {
    return this.find({ where: { status } });
  }
}
