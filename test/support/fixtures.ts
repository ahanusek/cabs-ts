import {
  Driver,
  DriverStatus,
  DriverType,
} from '../../src/entity/driver.entity';
import { DriverLicense } from '../../src/driverfleet/driver-license';
import { Client, PaymentType, Type } from '../../src/entity/client.entity';
import { Address } from '../../src/entity/address.entity';
import { Status, Transit } from '../../src/entity/transit.entity';
import { CarClass } from '../../src/entity/car-type.entity';
import { Money } from '../../src/money/money';

export function anActiveDriver(): Driver {
  const driver = new Driver();
  driver.setFirstName('Jan');
  driver.setLastName('Kowalski');
  driver.setDriverLicense(DriverLicense.withLicense('FARME100165AB5EW'));
  driver.setStatus(DriverStatus.ACTIVE);
  driver.setType(DriverType.REGULAR);
  return driver;
}

export function aClient(): Client {
  const client = new Client();
  client.setName('Anna');
  client.setLastName('Nowak');
  client.setType(Type.NORMAL);
  client.setDefaultPaymentType(PaymentType.PRE_PAID);
  return client;
}

export function anAddress(): Address {
  const address = new Address('Poland', 'Warsaw', 'Prosta', 1);
  address.setName(address.id);
  address.setPostalCode('00-001');
  address.setHash();
  return address;
}

export function aCompletedTransit(price: Money): Transit {
  const transit = new Transit();
  transit.setDriver(anActiveDriver());
  transit.setClient(aClient());
  transit.setFrom(anAddress());
  transit.setTo(anAddress());
  transit.setCarType(CarClass.REGULAR);
  transit.setStatus(Status.COMPLETED);
  transit.setPrice(price);
  transit.setDateTime(Date.UTC(2021, 3, 12, 12));
  transit.setCompleteAt(Date.UTC(2021, 3, 12, 13));
  return transit;
}
