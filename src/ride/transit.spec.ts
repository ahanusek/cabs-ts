import { Transit, TransitStatus } from './transit.entity';
import { Tariff } from '../pricing/tariff';
import { Distance } from '../geolocation/distance';

function ride() {
  return new Transit('request', Tariff.ofTime(new Date('2021-04-12T12:00:00')));
}

describe('An ongoing transit', () => {
  it('prices the actual distance on completion', () => {
    expect(ride().complete(Distance.ofKm(10)).toMajor()).toBe(19);
  });
  it('records completion', () => {
    const transit = ride();
    transit.complete(Distance.ofKm(10));
    expect(transit.getStatus()).toBe(TransitStatus.COMPLETED);
  });
  it('rejects final pricing before completion', () => {
    expect(() => ride().calculateFinalCosts()).toThrow();
  });
  it('rejects duplicate completion', () => {
    const transit = ride();
    transit.complete(Distance.ofKm(10));
    expect(() => transit.complete(Distance.ofKm(20))).toThrow();
  });
  it('rejects destination changes after completion', () => {
    const transit = ride();
    transit.complete(Distance.ofKm(10));
    expect(() => transit.changeDestination(Distance.ofKm(20))).toThrow();
  });
  it('updates the remaining trip distance', () => {
    const transit = ride();
    transit.changeDestination(Distance.ofKm(20));
    expect(transit.getDistance().toKm()).toBe(20);
  });
});
