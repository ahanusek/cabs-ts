import {
  Driver,
  DriverStatus,
  DriverType,
} from '../../src/driverfleet/driver.entity';
import { DriverLicense } from '../../src/driverfleet/driver-license';

export function anActiveDriver(): Driver {
  const driver = new Driver();
  driver.setFirstName('Jan');
  driver.setLastName('Kowalski');
  driver.setDriverLicense(DriverLicense.withLicense('FARME100165AB5EW'));
  driver.setStatus(DriverStatus.ACTIVE);
  driver.setType(DriverType.REGULAR);
  return driver;
}
