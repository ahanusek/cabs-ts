export class Money {
  public static readonly ZERO = new Money(0);

  constructor(private readonly value: number) {
    if (!Number.isSafeInteger(value)) {
      throw new Error('Money requires a safe integer amount in minor units');
    }
  }

  public static fromMajor(value: number): Money {
    return new Money(Math.round((value + Number.EPSILON) * 100));
  }

  public add(other: Money): Money {
    return new Money(this.value + other.value);
  }

  public subtract(other: Money): Money {
    return new Money(this.value - other.value);
  }

  public percentage(percentage: number): Money {
    return new Money(Math.round((percentage * this.value) / 100));
  }

  public max(other: Money): Money {
    return this.value >= other.value ? this : other;
  }

  public equals(other: Money): boolean {
    return this.value === other.value;
  }

  public toInt(): number {
    return this.value;
  }

  public toMajor(): number {
    return this.value / 100;
  }

  public toString(): string {
    return this.toMajor().toFixed(2);
  }
}
