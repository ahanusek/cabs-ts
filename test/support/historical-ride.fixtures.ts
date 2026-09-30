import type { EntityManager } from '@mikro-orm/postgresql';
import { TransitDetails } from '../../src/ride/details/transit-details.entity';
import { requestSnapshot } from '../../src/ride/details/request-snapshot';
import { RequestForTransit } from '../../src/ride/request-for-transit.entity';
import { Status } from '../../src/ride/details/status';
import { Tariff } from '../../src/pricing/tariff';
import { Distance } from '../../src/geolocation/distance';
import { Money } from '../../src/money/money';
import { CarClass } from '../../src/carfleet/car-type.entity';
import { ClientDto } from '../../src/crm/client.dto';
import { Driver } from '../../src/driverfleet/driver.entity';
import { Client } from '../../src/crm/client.entity';
import { Address } from '../../src/geolocation/address/address.entity';
import { anActiveDriver } from './driver.fixtures';
import { aClient } from './client.fixtures';
import { anAddress } from './address.fixtures';

export function historicalRide(
  options: {
    driver?: Driver;
    client?: Client;
    from?: Address;
    to?: Address;
    started?: number | null;
    completeAt?: number;
    price?: Money;
    status?: Status;
  } = {},
) {
  const driver = options.driver ?? anActiveDriver();
  const client = options.client ?? aClient();
  const from = options.from ?? anAddress();
  const to = options.to ?? anAddress();
  const now = Date.UTC(2021, 3, 12, 12);
  const request = new RequestForTransit(
    Tariff.ofTime(new Date(now)),
    Distance.ofKm(10),
  );
  const snapshot = requestSnapshot(request, {
    client: new ClientDto(client),
    from,
    to,
    carClass: CarClass.REGULAR,
    now,
  });
  snapshot.driverId = driver.id;
  snapshot.view.status = options.status ?? Status.COMPLETED;
  snapshot.view.price = (options.price ?? Money.fromMajor(50)).toMajor();
  snapshot.view.started = options.started ?? null;
  snapshot.view.completeAt = options.completeAt ?? now + 3600000;
  return { details: new TransitDetails(snapshot), driver, client, from, to };
}

export async function persistHistoricalRide(
  em: EntityManager,
  ride: ReturnType<typeof historicalRide>,
) {
  await em
    .persist([ride.details, ride.driver, ride.client, ride.from, ride.to])
    .flush();
}
