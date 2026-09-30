import { Status, Transit } from './transit.entity';

describe('Transit pricing before extracting Money', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it.each([
    ['2021-04-12T12:00:00', 10, 19],
    ['2021-04-17T12:00:00', 10, 23],
    ['2021-04-16T18:00:00', 10, 35],
    ['2021-12-31T12:00:00', 10, 46],
    ['2021-04-12T12:00:00', 1.123, 10.12],
  ])('prices %s and %s km', (date, km, price) => {
    jest.setSystemTime(new Date(date));
    const transit = new Transit();
    transit.setStatus(Status.DRAFT);
    transit.setKm(km);
    expect(transit.getEstimatedPrice()).toBe(price);
  });

  it('rejects estimating an already completed ride', () => {
    const transit = new Transit();
    transit.setStatus(Status.COMPLETED);
    expect(() => transit.estimateCost()).toThrow();
  });

  it('rejects finalizing the price before completion', () => {
    const transit = new Transit();
    transit.setStatus(Status.DRAFT);
    expect(() => transit.calculateFinalCosts()).toThrow();
  });
});
