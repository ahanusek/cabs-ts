const DRIVER_LICENSE_PATTERN = /^[A-Z9]{5}\d{6}[A-Z9]{2}\d[A-Z]{2}$/;

export class DriverLicense {
  private constructor(private readonly value: string) {}

  public static withLicense(value: string): DriverLicense {
    if (!DRIVER_LICENSE_PATTERN.test(value)) {
      throw new Error(`Illegal license no = ${value}`);
    }
    return new DriverLicense(value);
  }

  public static withoutValidation(value: string): DriverLicense {
    return new DriverLicense(value);
  }

  public asString(): string {
    return this.value;
  }
}
