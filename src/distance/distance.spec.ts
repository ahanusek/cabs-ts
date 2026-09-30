import { Distance } from './distance';

describe('Distance', () => {
  it.each([
    [10, 'km', '10km'],
    [1.1234, 'km', '1.123km'],
    [1.609344, 'miles', '1miles'],
    [1, 'miles', '0.621miles'],
    [0.0015, 'm', '2m'],
  ])('prints %s km in %s', (km, unit, expected) => {
    expect(Distance.ofKm(km).printIn(unit)).toBe(expected);
  });
  it('compares distances by value', () => {
    expect(Distance.ofKm(1).equals(Distance.ofKm(1))).toBe(true);
  });
  it.each([-1, Infinity, NaN])('rejects %s', (value) => {
    expect(() => Distance.ofKm(value)).toThrow();
  });
  it('rejects unsupported units', () => {
    expect(() => Distance.ZERO.printIn('yards')).toThrow();
  });
});
