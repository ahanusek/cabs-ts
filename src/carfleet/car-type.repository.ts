import { CarTypeActiveCounter } from './car-type-active-counter.entity';
import { EntityRepository, raw } from '@mikro-orm/postgresql';
import { CarClass, CarStatus, CarType } from './car-type.entity';
import { NotFoundException } from '@nestjs/common';

export class CarTypeRepository extends EntityRepository<CarType> {
  public async registerActiveCar(carClass: CarClass) {
    await this.getEntityManager().nativeUpdate(
      CarTypeActiveCounter,
      { carClass },
      {
        activeCarsCounter: raw('active_cars_counter + 1'),
      },
    );
  }

  public async unregisterActiveCar(carClass: CarClass) {
    await this.getEntityManager().nativeUpdate(
      CarTypeActiveCounter,
      { carClass, activeCarsCounter: { $gt: 0 } },
      {
        activeCarsCounter: raw('active_cars_counter - 1'),
      },
    );
  }

  public async countActiveCars(carClass: CarClass): Promise<number> {
    const counter = await this.getEntityManager().findOneOrFail(
      CarTypeActiveCounter,
      { carClass },
      { refresh: true },
    );
    return counter.activeCarsCounter;
  }

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
