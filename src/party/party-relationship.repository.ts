import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { Party } from './party.entity';
import { PartyId } from './party-id';
import { PartyRelationship } from './party-relationship.entity';

export interface RelationshipParty {
  id: PartyId;
  role: string;
}

export interface RelationshipStore {
  findFor(id: PartyId, name: string): Promise<PartyRelationship | null>;
  put(
    name: string,
    first: RelationshipParty,
    second: RelationshipParty,
  ): Promise<void>;
}

@Injectable()
export class PartyRelationshipRepository implements RelationshipStore {
  constructor(private readonly em: EntityManager) {}

  public findFor(id: PartyId, name: string): Promise<PartyRelationship | null> {
    return this.em.findOne(
      PartyRelationship,
      { name, $or: [{ partyA: id.asString() }, { partyB: id.asString() }] },
      { orderBy: { id: 'asc' } },
    );
  }

  @Transactional()
  public async put(
    name: string,
    first: RelationshipParty,
    second: RelationshipParty,
  ): Promise<void> {
    const partyA = await this.em.upsert(Party, { id: first.id.asString() });
    const partyB = await this.em.upsert(Party, { id: second.id.asString() });
    let relationship = await this.em.findOne(PartyRelationship, {
      name,
      $or: [
        { partyA, partyB },
        { partyA: partyB, partyB: partyA },
      ],
    });
    if (relationship) {
      relationship.partyA = partyA;
      relationship.partyB = partyB;
      relationship.roleA = first.role;
      relationship.roleB = second.role;
    } else {
      relationship = new PartyRelationship(
        name,
        { party: partyA, role: first.role },
        { party: partyB, role: second.role },
      );
    }
    await this.em.persist(relationship).flush();
  }
}
