import {
  Entity,
  Index,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import type { TransitView } from './transit-view';

export interface TransitSnapshot {
  view: TransitView;
  fromHash: string;
  toHash: string;
  driverId: string | null;
  fromAddressId: string;
  toAddressId: string;
}

@Entity()
@Index({ properties: ['driverId', 'completeAt'] })
export class TransitDetails {
  @PrimaryKey({ type: 'uuid' })
  public transitId: string;

  @Property({ type: 'uuid' })
  public clientId: string;

  @Property({ type: 'uuid', nullable: true })
  public driverId: string | null;

  @Property({ type: 'uuid' })
  public fromAddressId: string;

  @Property({ type: 'uuid' })
  public toAddressId: string;

  @Property({ type: 'bigint', runtimeType: 'number', nullable: true })
  public completeAt: number | null;

  @Property()
  public status: string;

  @Property() public fromHash: string;
  @Property() public toHash: string;

  @Property({ type: 'json' })
  public view: TransitView;

  constructor(snapshot: TransitSnapshot) {
    this.fromHash = snapshot.fromHash;
    this.toHash = snapshot.toHash;
    this.transitId = snapshot.view.id;
    this.clientId = snapshot.view.clientDto.id;
    this.driverId = snapshot.driverId;
    this.fromAddressId = snapshot.fromAddressId;
    this.toAddressId = snapshot.toAddressId;
    this.completeAt = snapshot.view.completeAt;
    this.status = snapshot.view.status;
    this.view = structuredClone(snapshot.view);
  }
}
