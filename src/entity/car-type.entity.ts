import { NotAcceptableException } from '@nestjs/common';
import { Entity, Property, Enum } from '@mikro-orm/core';
import { BaseEntity } from '../common/base.entity';
import { CarTypeRepository } from '../repository/car-type.repository';

export enum CarClass {
  ECO = 'eco',
  REGULAR = 'regular',
  VAN = 'van',
  PREMIUM = 'premium',
}

export enum CarStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
}

@Entity({ repository: () => CarTypeRepository })
export class CarType extends BaseEntity {
  @Enum(() => CarClass)
  public carClass!: CarClass;

  @Property({ nullable: true, type: 'varchar' })
  public description: string | null = null;

  @Enum({ items: () => CarStatus, default: CarStatus.INACTIVE })
  public status: CarStatus = CarStatus.INACTIVE;

  @Property({ type: 'int', default: 0 })
  public carsCounter: number = 0;

  @Property({ type: 'int', default: 0 })
  public minNoOfCarsToActivateClass: number = 0;

  @Property({ type: 'int', default: 0 })
  public activeCarsCounter: number = 0;

  constructor(
    carClass?: CarClass,
    description?: string,
    minNoOfCarsToActivateClass?: number,
  ) {
    super();
    if (carClass) this.carClass = carClass;
    if (description) this.description = description;
    if (minNoOfCarsToActivateClass)
      this.minNoOfCarsToActivateClass = minNoOfCarsToActivateClass;
  }

  public registerActiveCar() {
    this.activeCarsCounter++;
  }

  public unregisterActiveCar() {
    this.activeCarsCounter--;
  }

  public registerCar() {
    this.carsCounter++;
  }

  public unregisterCar() {
    this.carsCounter--;
    if (this.carsCounter < 0) {
      throw new NotAcceptableException('Cars counter can not be below 0');
    }
  }

  public activate() {
    if (this.carsCounter < this.minNoOfCarsToActivateClass) {
      throw new NotAcceptableException(
        `Cannot activate car class when less than ${this.minNoOfCarsToActivateClass} cars in the fleet`,
      );
    }
    this.status = CarStatus.ACTIVE;
  }

  public deactivate() {
    this.status = CarStatus.INACTIVE;
  }

  public getCarClass() {
    return this.carClass;
  }

  public setCarClass(carClass: CarClass) {
    this.carClass = carClass;
  }

  public getDescription() {
    return this.description;
  }

  public setDescription(description: string) {
    this.description = description;
  }

  public getStatus() {
    return this.status;
  }

  public getCarsCounter() {
    return this.carsCounter;
  }

  public getActiveCarsCounter() {
    return this.activeCarsCounter;
  }

  public getMinNoOfCarsToActivateClass() {
    return this.minNoOfCarsToActivateClass;
  }
}
