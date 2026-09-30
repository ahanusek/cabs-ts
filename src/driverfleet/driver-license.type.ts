import { Type } from '@mikro-orm/core';
import { DriverLicense } from './driver-license';

export class DriverLicenseType extends Type<DriverLicense, string> {
  public convertToDatabaseValue(value: DriverLicense): string {
    return value.asString();
  }

  public convertToJSValue(value: string): DriverLicense {
    return DriverLicense.withoutValidation(value);
  }

  public getColumnType(): string {
    return 'varchar(255)';
  }

  public compareAsType(): string {
    return 'string';
  }
}
