import { randomUUID } from 'node:crypto';

export class PartyId {
  constructor(private readonly value: string = randomUUID()) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      )
    ) {
      throw new RangeError('Party identity must be a UUID');
    }
  }
  public asString(): string {
    return this.value;
  }
  public equals(other: PartyId): boolean {
    return this.value === other.value;
  }
}
