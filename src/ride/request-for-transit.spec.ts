import { RequestForTransit } from './request-for-transit.entity';
import { Tariff } from '../pricing/tariff';
import { Distance } from '../geolocation/distance';

describe('Request pricing', () => {
  it.each([
    ['2021-04-12T12:00:00', 10, 19],
    ['2021-04-17T12:00:00', 10, 23],
    ['2021-04-16T18:00:00', 10, 35],
    ['2021-12-31T12:00:00', 10, 46],
    ['2021-04-12T12:00:00', 1.123, 10.12],
  ])('estimates %s and %s km', (date, km, expected) => {
    const request = new RequestForTransit(
      Tariff.ofTime(new Date(date)),
      Distance.ofKm(km),
    );
    expect(request.getEstimatedPrice().toMajor()).toBe(expected);
  });
});
