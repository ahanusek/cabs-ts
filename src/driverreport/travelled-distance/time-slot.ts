export const FIVE_MINUTES = 5 * 60 * 1000;

export class TimeSlot {
  constructor(
    public readonly beginning: number,
    public readonly end: number,
  ) {
    if (
      !Number.isFinite(beginning) ||
      !Number.isFinite(end) ||
      end <= beginning
    ) {
      throw new RangeError('A time slot must end after it begins');
    }
  }

  public static containing(timestamp: number): TimeSlot {
    const beginning = Math.floor(timestamp / FIVE_MINUTES) * FIVE_MINUTES;
    return new TimeSlot(beginning, beginning + FIVE_MINUTES);
  }

  public contains(timestamp: number): boolean {
    return timestamp >= this.beginning && timestamp < this.end;
  }

  public endsAt(timestamp: number): boolean {
    return this.end === timestamp;
  }
  public isBefore(timestamp: number): boolean {
    return this.end < timestamp;
  }
  public previous(): TimeSlot {
    return new TimeSlot(this.beginning - FIVE_MINUTES, this.end - FIVE_MINUTES);
  }
}
