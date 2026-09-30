import { ConstantUntil } from './constant-until';

describe('Miles value object', () => {
  it.each([
    [99, 20],
    [100, 20],
    [101, 0],
  ])('returns the balance at %i', (moment, amount) => {
    expect(new ConstantUntil(20, 100).getAmountFor(moment)).toBe(amount);
  });

  it('keeps non-expiring miles indefinitely', () => {
    expect(
      ConstantUntil.forever(20).getAmountFor(Number.MAX_SAFE_INTEGER),
    ).toBe(20);
  });

  it('returns a new value when subtracting', () => {
    const original = new ConstantUntil(20, 100);
    const reduced = original.subtract(7, 50);
    expect([
      original.getAmountFor(50),
      reduced.getAmountFor(50),
      reduced.expiresAt(),
    ]).toEqual([20, 13, 100]);
  });

  it('rejects subtracting expired miles', () => {
    expect(() => new ConstantUntil(20, 100).subtract(1, 101)).toThrow(
      'Insufficient',
    );
  });

  it('rejects overspending', () => {
    expect(() => ConstantUntil.forever(20).subtract(21, 0)).toThrow(
      'Insufficient',
    );
  });

  it.each([-1, 0.5, NaN, Infinity])(
    'rejects an invalid amount %s',
    (amount) => {
      expect(() => ConstantUntil.forever(amount)).toThrow(RangeError);
    },
  );
});
