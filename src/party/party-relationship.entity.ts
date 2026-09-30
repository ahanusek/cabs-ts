import {
  Entity,
  Property,
  ManyToOne,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { BaseEntity } from '../common/base.entity';
import { Party } from './party.entity';

@Entity()
@Unique({ properties: ['name', 'partyA', 'partyB'] })
export class PartyRelationship extends BaseEntity {
  @Property()
  public name: string;
  @Property()
  public roleA: string;
  @Property()
  public roleB: string;
  @ManyToOne(() => Party, { eager: true })
  public partyA: Party;
  @ManyToOne(() => Party, { eager: true })
  public partyB: Party;

  constructor(
    name: string,
    first: { party: Party; role: string },
    second: { party: Party; role: string },
  ) {
    super();
    this.name = name;
    this.partyA = first.party;
    this.roleA = first.role;
    this.partyB = second.party;
    this.roleB = second.role;
  }
}
