import { TransitDto } from './transit.dto';

describe('Tariffs displayed to the passenger', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it.each([
    ['2021-04-12T12:00:00', 'Standard', 1],
    ['2021-04-16T17:00:00', 'Weekend+', 2.5],
    ['2021-04-17T12:00:00', 'Weekend', 1.5],
    ['2021-12-31T12:00:00', 'Sylwester', 3.5],
    ['2022-01-01T05:00:00', 'Sylwester', 3.5],
  ])('recognizes the tariff at %s', (date, name, rate) => {
    jest.setSystemTime(new Date(date));
    const dto = Object.create(TransitDto.prototype) as TransitDto;
    dto.setTariff();
    expect([dto.getTariff(), dto.getKmRate()]).toEqual([name, rate]);
  });
});
