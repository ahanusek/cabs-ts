const KILOMETERS_PER_MILE = 1.609344;
const METERS_PER_KILOMETER = 1000;

export class Distance {
  public static readonly ZERO = Distance.ofKm(0);

  private constructor(private readonly kilometers: number) {}

  public static ofKm(kilometers: number): Distance {
    if (!Number.isFinite(kilometers) || kilometers < 0) {
      throw new Error('Distance must be a finite, non-negative number');
    }
    return new Distance(kilometers);
  }

  public toKm(): number {
    return this.kilometers;
  }

  public add(other: Distance): Distance {
    return Distance.ofKm(this.kilometers + other.kilometers);
  }

  public equals(other: Distance): boolean {
    return this.kilometers === other.kilometers;
  }

  public printIn(unit: string): string {
    const formats: Record<string, () => string> = {
      km: () => `${this.format(this.kilometers)}km`,
      miles: () => `${this.format(this.kilometers / KILOMETERS_PER_MILE)}miles`,
      m: () => `${Math.round(this.kilometers * METERS_PER_KILOMETER)}m`,
    };
    const format = formats[unit];
    if (!Object.hasOwn(formats, unit)) throw new Error(`Invalid unit ${unit}`);
    return format();
  }

  private format(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(3);
  }
}
