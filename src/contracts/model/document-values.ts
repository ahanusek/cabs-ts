import { randomUUID } from 'node:crypto';

export class ContentId {
  constructor(private readonly value: string = randomUUID()) {}
  public asString(): string {
    return this.value;
  }
  public equals(other: ContentId): boolean {
    return this.value === other.value;
  }
}

export class DocumentNumber {
  constructor(private readonly value: string) {
    if (!value.trim()) throw new RangeError('Document number cannot be empty');
  }
  public asString(): string {
    return this.value;
  }
}

export class ContentVersion {
  constructor(private readonly value: string) {
    if (!value.trim()) throw new RangeError('Content version cannot be empty');
  }
  public asString(): string {
    return this.value;
  }
}
