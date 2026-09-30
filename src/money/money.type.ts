import { Type } from '@mikro-orm/core';
import { Money } from './money';

// Keep the existing database/API amounts in major units; the domain uses cents.
export class MoneyType extends Type<
  Money | null | undefined,
  number | null | undefined
> {
  public convertToDatabaseValue(
    value: Money | null | undefined,
  ): number | null | undefined {
    return value == null ? value : value.toMajor();
  }

  public convertToJSValue(
    value: number | null | undefined,
  ): Money | null | undefined {
    return value == null ? value : Money.fromMajor(Number(value));
  }

  public getColumnType(): string {
    return 'numeric(14, 2)';
  }

  public compareAsType(): string {
    return 'number';
  }
}
