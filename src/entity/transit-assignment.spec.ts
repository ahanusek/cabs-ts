import { Transit, Status } from './transit.entity';
import { Distance } from '../distance/distance';
import { anAddress } from '../../test/support/fixtures';

describe('Destination and assignment rules', () => {
  it('rejects changing a completed destination', () => {
    const transit = new Transit();
    transit.setStatus(Status.COMPLETED);
    expect(() =>
      transit.changeDestinationTo(anAddress(), Distance.ofKm(10)),
    ).toThrow();
  });
  it.each([
    [300000, false],
    [300001, true],
  ])('expires assignment after five minutes (%s)', (now, expired) => {
    const transit = new Transit();
    transit.setStatus(Status.WAITING_FOR_DRIVER_ASSIGNMENT);
    transit.setPublished(0);
    expect(transit.shouldStopWaiting(now)).toBe(expired);
  });
  it('resets assignment state on failure', () => {
    const transit = new Transit();
    transit.setStatus(Status.WAITING_FOR_DRIVER_ASSIGNMENT);
    transit.setAwaitingDriversResponses(5);
    transit.failDriverAssignment();
    expect([
      transit.getStatus(),
      transit.getKm(),
      transit.getAwaitingDriversResponses(),
    ]).toEqual([Status.DRIVER_ASSIGNMENT_FAILED, 0, 0]);
  });
});
