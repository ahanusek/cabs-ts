import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import type { PositionSample } from './position-sample';
import { DistanceCalculator } from '../../service/distance-calculator.service';
import { TimeSlot, FIVE_MINUTES } from './time-slot';

@Entity()
export class TravelledDistance {
  @PrimaryKey({ type: 'uuid' })
  public readonly driverId: string;

  @PrimaryKey({ type: 'bigint', runtimeType: 'number' })
  public readonly beginning: number;

  @Property({ type: 'double' })
  private kilometers = 0;

  @Property({ type: 'json' })
  private samples: PositionSample[] = [];

  constructor(driverId: string, slot: TimeSlot, position: PositionSample) {
    this.driverId = driverId;
    this.beginning = slot.beginning;
    this.addPosition(position);
  }

  public addPosition(position: PositionSample): void {
    if (
      !new TimeSlot(this.beginning, this.beginning + FIVE_MINUTES).contains(
        position.seenAt,
      )
    ) {
      throw new RangeError('Position is outside this time slot');
    }
    const sample = {
      id: position.id,
      latitude: position.latitude,
      longitude: position.longitude,
      seenAt: position.seenAt,
    };
    if (this.samples.some((existing) => existing.id === sample.id)) return;
    this.samples = [...this.samples, sample].sort(
      (first, second) => first.seenAt - second.seenAt,
    );
  }

  public firstPosition(): PositionSample {
    return { ...this.samples[0] };
  }
  public getKilometers(): number {
    return this.kilometers;
  }

  public recalculate(
    calculator: DistanceCalculator,
    next?: PositionSample,
  ): void {
    const positions = next ? [...this.samples, next] : this.samples;
    this.kilometers = positions.slice(1).reduce((total, point, index) => {
      const previous = positions[index];
      return (
        total +
        calculator.calculateByGeo(
          previous.latitude,
          previous.longitude,
          point.latitude,
          point.longitude,
        )
      );
    }, 0);
  }
}
