import { TwoStepExpiringMiles } from './two-step-expiring-miles';
import { restoreMiles } from './miles-json';
import { ConstantUntil } from './constant-until';

describe('Miles expiring in two steps', () => {
  it.each([
    [50, 9],
    [100, 9],
    [101, 5],
    [200, 5],
    [201, 0],
  ])('has the expected balance at %i', (moment, amount) => {
    expect(new TwoStepExpiringMiles(9, 100, 200).getAmountFor(moment)).toBe(
      amount,
    );
  });

  it('subtracts after the first expiration without halving twice', () => {
    const miles = new TwoStepExpiringMiles(10, 100, 200);
    expect(miles.subtract(2, 150).getAmountFor(150)).toBe(3);
  });

  it('preserves the second expiration after subtraction', () => {
    expect(
      new TwoStepExpiringMiles(10, 100, 200).subtract(2, 150).getAmountFor(201),
    ).toBe(0);
  });

  it('rejects spending expired miles', () => {
    expect(() =>
      new TwoStepExpiringMiles(10, 100, 200).subtract(1, 201),
    ).toThrow('Insufficient');
  });

  it.each([
    ConstantUntil.forever(20),
    new ConstantUntil(10, 200),
    new TwoStepExpiringMiles(10, 100, 200),
  ])('preserves behavior through JSON persistence', (miles) => {
    const restored = restoreMiles(JSON.parse(JSON.stringify(miles.snapshot())));
    expect(
      [50, 100, 101, 200, 201].map((time) => restored.getAmountFor(time)),
    ).toEqual([50, 100, 101, 200, 201].map((time) => miles.getAmountFor(time)));
  });
});
