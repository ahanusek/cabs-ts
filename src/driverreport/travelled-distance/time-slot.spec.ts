import { TimeSlot, FIVE_MINUTES } from './time-slot';

describe('Five-minute time slots', () => {
  it.each([0, 1, FIVE_MINUTES - 1])('contains offset %i', (time) => {
    expect(TimeSlot.containing(time)).toEqual(new TimeSlot(0, FIVE_MINUTES));
  });
  it('starts the next interval at the end boundary', () => {
    expect(TimeSlot.containing(FIVE_MINUTES)).toEqual(
      new TimeSlot(FIVE_MINUTES, 2 * FIVE_MINUTES),
    );
  });
  it('excludes the end timestamp', () => {
    expect(new TimeSlot(0, FIVE_MINUTES).contains(FIVE_MINUTES)).toBe(false);
  });
  it('finds the preceding interval', () => {
    expect(TimeSlot.containing(FIVE_MINUTES).previous()).toEqual(
      new TimeSlot(0, FIVE_MINUTES),
    );
  });
  it.each([
    [1, 1],
    [2, 1],
    [NaN, 1],
  ])('rejects invalid interval %i to %i', (from, to) => {
    expect(() => new TimeSlot(from, to)).toThrow(RangeError);
  });
});
