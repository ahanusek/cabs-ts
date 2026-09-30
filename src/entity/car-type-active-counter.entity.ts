import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { CarClass } from './car-type.entity';

@Entity()
export class CarTypeActiveCounter {
  @PrimaryKey({ type: 'string' })
  public carClass: CarClass;

  @Property({ type: 'integer', default: 0 })
  public activeCarsCounter = 0;

  constructor(carClass: CarClass) {
    this.carClass = carClass;
  }
}
