import { RequestForTransit } from '../request-for-transit.entity';
import { ClientDto } from '../../crm/client.dto';
import { Address } from '../../geolocation/address/address.entity';
import { AddressDto } from '../../geolocation/address/address.dto';
import { CarClass } from '../../carfleet/car-type.entity';
import { Status } from './status';
import type { TransitSnapshot } from './transit-details.entity';

export function requestSnapshot(
  request: RequestForTransit,
  context: {
    client: ClientDto;
    from: Address;
    to: Address;
    carClass: CarClass;
    now: number;
  },
): TransitSnapshot {
  const { client, from, to, carClass, now } = context;
  const tariff = request.getTariff();
  return {
    driverId: null,
    fromAddressId: from.id,
    toAddressId: to.id,
    fromHash: from.getHash(),
    toHash: to.getHash(),
    view: {
      id: request.id,
      tariff: tariff.getName(),
      status: Status.DRAFT,
      factor: null,
      distance: request.getDistance().toKm(),
      kmRate: tariff.getKmRate(),
      baseFee: tariff.getBaseFee(),
      estimatedPrice: request.getEstimatedPrice().toMajor(),
      date: now,
      dateTime: now,
      published: 0,
      acceptedAt: null,
      started: null,
      completeAt: null,
      proposedDrivers: [],
      to: new AddressDto(to),
      from: new AddressDto(from),
      carClass,
      clientDto: JSON.parse(JSON.stringify(client)),
    },
  };
}
