import { Transit, Status } from './transit.entity';
import { CarClass } from './car-type.entity';
import { Distance } from '../distance/distance';
import { aClient, anAddress } from '../../test/support/fixtures';

describe('Constructing a transit request', () => {
  it('keeps creation data together and captures the tariff', () => {
    const transit = new Transit({
      from: anAddress(),
      to: anAddress(),
      client: aClient(),
      carClass: CarClass.REGULAR,
      when: new Date('2021-12-31T12:00:00').getTime(),
      distance: Distance.ofKm(10),
    });
    expect([
      transit.getStatus(),
      transit.getTariff().getName(),
      transit.estimateCost().toMajor(),
    ]).toEqual([Status.DRAFT, 'Sylwester', 46]);
  });
});
