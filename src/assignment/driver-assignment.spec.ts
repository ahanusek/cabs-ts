import { DriverAssignment } from './driver-assignment.entity';

describe('Driver assignment', () => {
  it('counts each proposed driver once', () => {
    const assignment = new DriverAssignment('request', 0);
    assignment.proposeTo('driver');
    assignment.proposeTo('driver');
    expect(assignment.getAwaitingResponses()).toBe(1);
  });
  it('counts each rejection once', () => {
    const assignment = new DriverAssignment('request', 0);
    assignment.proposeTo('driver');
    assignment.rejectBy('driver');
    assignment.rejectBy('driver');
    expect(assignment.getAwaitingResponses()).toBe(0);
  });
  it('cannot accept an unproposed driver', () => {
    expect(() =>
      new DriverAssignment('request', 0).acceptBy('driver'),
    ).toThrow();
  });
  it('cannot accept a driver who rejected', () => {
    const assignment = new DriverAssignment('request', 0);
    assignment.proposeTo('driver');
    assignment.rejectBy('driver');
    expect(() => assignment.acceptBy('driver')).toThrow();
  });
  it('accepts a proposed driver', () => {
    const assignment = new DriverAssignment('request', 0);
    assignment.proposeTo('driver');
    assignment.acceptBy('driver');
    expect(assignment.getAssignedDriver()).toBe('driver');
  });
  it('cannot accept a second driver', () => {
    const assignment = new DriverAssignment('request', 0);
    assignment.proposeTo('one');
    assignment.proposeTo('two');
    assignment.acceptBy('one');
    expect(() => assignment.acceptBy('two')).toThrow();
  });
  it('cannot revive a cancelled assignment', () => {
    const assignment = new DriverAssignment('request', 0);
    assignment.proposeTo('driver');
    assignment.cancel();
    expect(() => assignment.acceptBy('driver')).toThrow();
  });
  it.each([
    [300000, false],
    [300001, true],
  ])('expires after five minutes (%s)', (now, expired) => {
    expect(new DriverAssignment('request', 0).isExpired(now)).toBe(expired);
  });
});
