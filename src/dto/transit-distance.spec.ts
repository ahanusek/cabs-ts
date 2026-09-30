import { TransitDto } from './transit.dto';

describe('The distance presented to a passenger', () => {
  it.each([
    [10, 'km', '10km'],
    [10.1234, 'km', '10.123km'],
    [1.609344, 'miles', '1miles'],
    [1, 'miles', '0.621miles'],
    [0.0015, 'm', '2m'],
    [0, 'km', '0km'],
  ])('formats %s km in %s', (km, unit, expected) => {
    const dto = Object.create(TransitDto.prototype) as TransitDto;
    dto.distance = km;
    expect(dto.getDistance(unit)).toBe(expected);
  });

  it('rejects an unsupported unit', () => {
    const dto = Object.create(TransitDto.prototype) as TransitDto;
    dto.distance = 1;
    expect(() => dto.getDistance('light-years')).toThrow();
  });
});
