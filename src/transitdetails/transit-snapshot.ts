import { Transit } from '../entity/transit.entity';
import { TransitDto } from '../dto/transit.dto';
import type { TransitSnapshot } from './transit-details.entity';

export function transitSnapshot(transit: Transit): TransitSnapshot {
  return {
    view: JSON.parse(JSON.stringify(new TransitDto(transit))),
    driverId: transit.getDriver()?.id ?? null,
    fromAddressId: transit.getFrom().id,
    toAddressId: transit.getTo().id,
  };
}
