import { Status, Transit } from '../../src/entity/transit.entity';
import { CarClass } from '../../src/carfleet/car-type.entity';
import { Money } from '../../src/money/money';

import { anActiveDriver } from './driver.fixtures';
import { aClient } from './client.fixtures';
import { anAddress } from './address.fixtures';

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
