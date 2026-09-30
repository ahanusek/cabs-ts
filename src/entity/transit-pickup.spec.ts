import { Transit, Status } from './transit.entity';
import { Distance } from '../distance/distance';
import { anAddress } from '../../test/support/fixtures';

describe('Pickup rules inside Transit', () => {
  it('allows a change while waiting for a driver', () => {
    const transit = new Transit();
    transit.setStatus(Status.WAITING_FOR_DRIVER_ASSIGNMENT);
    const address = anAddress();
    transit.changePickupTo(address, Distance.ofKm(10), 0.25);
    expect(transit.getFrom()).toBe(address);
  });
  it('rejects a fourth pickup change', () => {
    const transit = new Transit();
    transit.setStatus(Status.DRAFT);
    for (let index = 0; index < 3; index++)
      transit.changePickupTo(anAddress(), Distance.ofKm(10), 0.25);
    expect(() =>
      transit.changePickupTo(anAddress(), Distance.ofKm(10), 0.25),
    ).toThrow();
  });
  it('rejects moving beyond 250 meters', () => {
    const transit = new Transit();
    transit.setStatus(Status.DRAFT);
    expect(() =>
      transit.changePickupTo(anAddress(), Distance.ofKm(10), 0.251),
    ).toThrow();
  });
});
