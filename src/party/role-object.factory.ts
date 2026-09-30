import { Party } from './party.entity';
import { PartyRelationship } from './party-relationship.entity';

export abstract class PartyRole {
  constructor(protected readonly party: Party) {}
}

type RoleConstructor = new (party: Party) => PartyRole;

export class RoleObjectFactory {
  private readonly roles: PartyRole[];
  constructor(
    relationship: PartyRelationship,
    registry: ReadonlyMap<string, RoleConstructor>,
  ) {
    this.roles = [
      this.instantiate(relationship.roleA, relationship.partyA, registry),
      this.instantiate(relationship.roleB, relationship.partyB, registry),
    ];
  }

  public getRole<T extends PartyRole>(
    role: abstract new (party: Party) => T,
  ): T | undefined {
    return this.roles.find((candidate) => candidate instanceof role) as
      T | undefined;
  }

  private instantiate(
    name: string,
    party: Party,
    registry: ReadonlyMap<string, RoleConstructor>,
  ): PartyRole {
    const Role = registry.get(name);
    if (!Role) throw new Error(`Unknown party role: ${name}`);
    return new Role(party);
  }
}
