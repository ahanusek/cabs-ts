import { CarClass } from '../entity/car-type.entity';
import { CarTypeRepository } from '../repository/car-type.repository';

// A deliberately temporary course step: the Java history reverts this proxy.
export class ActiveCarCounterProxy {
  constructor(
    private readonly carClass: CarClass,
    private readonly repository: CarTypeRepository,
  ) {}

  public register(): Promise<void> {
    return this.repository.registerActiveCar(this.carClass);
  }

  public unregister(): Promise<void> {
    return this.repository.unregisterActiveCar(this.carClass);
  }
}
