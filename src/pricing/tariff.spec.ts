import { Tariff } from './tariff';
import { Distance } from '../distance/distance';

describe('Tariff', () => {
  it.each([
    ['2021-04-16T16:59:59', 'Standard'],
    ['2021-04-16T17:00:00', 'Weekend+'],
    ['2021-04-17T06:00:00', 'Weekend+'],
    ['2021-04-17T07:00:00', 'Weekend'],
    ['2021-04-17T17:00:00', 'Weekend+'],
    ['2021-04-18T06:00:00', 'Weekend+'],
    ['2021-04-18T07:00:00', 'Weekend'],
    ['2021-12-31T00:00:00', 'Sylwester'],
    ['2022-01-01T06:00:00', 'Sylwester'],
    ['2022-01-01T07:00:00', 'Weekend'],
  ])('selects %s', (time, expected) => {
    expect(Tariff.ofTime(new Date(time)).getName()).toBe(expected);
  });
  it('calculates the price including the starting fee', () => {
    const tariff = Tariff.ofTime(new Date('2021-04-12T12:00:00'));
    expect(tariff.calculateCost(Distance.ofKm(1.123)).toString()).toBe('10.12');
  });
});
