import { TransitDemand, DemandStatus } from './transit-demand.entity';

describe('Demand while waiting for a driver', () => {
  it('accepts a waiting demand', () => {
    const demand = new TransitDemand('request');
    demand.accept();
    expect(demand.getStatus()).toBe(DemandStatus.ACCEPTED);
  });
  it('cancels a waiting demand', () => {
    const demand = new TransitDemand('request');
    demand.cancel();
    expect(demand.getStatus()).toBe(DemandStatus.CANCELLED);
  });
  it('cannot cancel after acceptance', () => {
    const demand = new TransitDemand('request');
    demand.accept();
    expect(() => demand.cancel()).toThrow();
  });
  it('cannot change pickup after acceptance', () => {
    const demand = new TransitDemand('request');
    demand.accept();
    expect(() => demand.changePickup(0.1)).toThrow();
  });
  it.each([0.251, -0.1, NaN, Infinity])(
    'rejects an invalid pickup distance %s',
    (distance) => {
      expect(() =>
        new TransitDemand('request').changePickup(distance),
      ).toThrow();
    },
  );
  it('allows at most three changes within 250 meters', () => {
    const demand = new TransitDemand('request');
    for (let index = 0; index < 3; index++) demand.changePickup(0.25);
    expect(() => demand.changePickup(0.25)).toThrow();
  });
});
