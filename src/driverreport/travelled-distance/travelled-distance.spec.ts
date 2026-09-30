import { TravelledDistance } from './travelled-distance.entity';
import { TimeSlot, FIVE_MINUTES } from './time-slot';
import { randomUUID } from 'node:crypto';
import type { PositionSample } from './position-sample';
import { DistanceCalculator } from '../../geolocation/distance-calculator.service';
import { Distance } from '../../geolocation/distance';

const origin = [53.32055555555556, -1.729722222222222] as const;
const destination = [53.31861111111111, -1.699722222222222] as const;
const calculator = new DistanceCalculator();

describe('Travelled distance projection without an application or database', () => {
  it('has zero distance for one point', () => {
    const interval = new TravelledDistance(
      'driver',
      TimeSlot.containing(0),
      point(origin, 0),
    );
    interval.recalculate(calculator);
    expect(interval.getKilometers()).toBe(0);
  });

  it('sums all legs within a slot', () => {
    const interval = roundTrip();
    expect(Distance.ofKm(interval.getKilometers()).printIn('km')).toBe(
      '4.009km',
    );
  });

  it('recalculates in event time after an out-of-order arrival', () => {
    const interval = new TravelledDistance(
      'driver',
      TimeSlot.containing(0),
      point(origin, 0),
    );
    interval.addPosition(point(origin, 2));
    interval.addPosition(point(destination, 1));
    interval.recalculate(calculator);
    expect(Distance.ofKm(interval.getKilometers()).printIn('km')).toBe(
      '4.009km',
    );
  });

  it('includes the leg to the next interval exactly once', () => {
    const interval = roundTrip();
    interval.recalculate(calculator, {
      id: 'next',
      latitude: destination[0],
      longitude: destination[1],
      seenAt: FIVE_MINUTES,
    });
    const once = interval.getKilometers();
    interval.recalculate(calculator, {
      id: 'next',
      latitude: destination[0],
      longitude: destination[1],
      seenAt: FIVE_MINUTES,
    });
    expect(interval.getKilometers()).toBe(once);
  });

  it('rejects a position from another slot', () => {
    expect(() => roundTrip().addPosition(point(origin, FIVE_MINUTES))).toThrow(
      'outside',
    );
  });

  function roundTrip() {
    const interval = new TravelledDistance(
      'driver',
      TimeSlot.containing(0),
      point(origin, 0),
    );
    interval.addPosition(point(destination, 1));
    interval.addPosition(point(origin, 2));
    interval.recalculate(calculator);
    return interval;
  }

  function point(
    coordinates: readonly [number, number],
    seenAt: number,
  ): PositionSample {
    return {
      id: randomUUID(),
      latitude: coordinates[0],
      longitude: coordinates[1],
      seenAt,
    };
  }
});
