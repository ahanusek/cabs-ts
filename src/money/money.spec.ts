import { Money } from './money';

describe('Money', () => {
  it.each([
    [10000, '100.00'],
    [0, '0.00'],
    [1012, '10.12'],
    [-5, '-0.05'],
  ])('formats %s minor units as %s', (value, expected) => {
    expect(new Money(value).toString()).toBe(expected);
  });
  it('adds without mutating its operands', () => {
    const first = new Money(1020);
    expect([first.add(new Money(22)).toInt(), first.toInt()]).toEqual([
      1042, 1020,
    ]);
  });
  it('allows a negative result of subtraction', () => {
    expect(new Money(2).subtract(new Money(3)).toInt()).toBe(-1);
  });
  it.each([
    [8800, 30, 2640],
    [1, 40, 0],
    [1, 50, 1],
  ])('rounds percentages to minor units', (value, percentage, expected) => {
    expect(new Money(value).percentage(percentage).toInt()).toBe(expected);
  });
  it('compares by value', () => {
    expect(new Money(42).equals(new Money(42))).toBe(true);
  });
  it('rejects fractional minor units', () => {
    expect(() => new Money(0.5)).toThrow();
  });
  it('converts the existing HTTP API major units', () => {
    expect(Money.fromMajor(0.1 + 0.2).toInt()).toBe(30);
  });
});
