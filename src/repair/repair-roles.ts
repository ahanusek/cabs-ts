import { Party } from '../party/party.entity';
import { Injectable } from '@nestjs/common';
import { Money } from '../money/money';
import { PartyRole, RoleObjectFactory } from '../party/role-object.factory';
import { PartyRelationship } from '../party/party-relationship.entity';
import { PartyId } from '../party/party-id';
import { Parts } from './parts';

export interface RepairRequest {
  vehicle: PartyId;
  parts: ReadonlySet<Parts>;
}

export type ResolveResult =
  | { status: 'error' }
  | {
      status: 'success';
      handlingParty: string;
      totalCost: Money;
      acceptedParts: ReadonlySet<Parts>;
    };

export abstract class RoleForRepairer extends PartyRole {
  public abstract handle(request: RepairRequest): ResolveResult;
}

export class Warranty extends RoleForRepairer {
  public handle(request: RepairRequest): ResolveResult {
    return {
      status: 'success',
      handlingParty: this.party.id,
      totalCost: Money.ZERO,
      acceptedParts: new Set(request.parts),
    };
  }
}

export class ExtendedInsurance extends RoleForRepairer {
  public handle(request: RepairRequest): ResolveResult {
    return {
      status: 'success',
      handlingParty: this.party.id,
      totalCost: Money.ZERO,
      acceptedParts: new Set(
        [...request.parts].filter((part) => part !== Parts.PAINT),
      ),
    };
  }
}

export class Customer extends PartyRole {}
export class Insured extends PartyRole {}

export enum RepairRole {
  GUARANTOR = 'guarantor',
  CUSTOMER = 'customer',
  INSURER = 'insurer',
  INSURED = 'insured',
}

@Injectable()
export class RepairRoleFactory {
  public from(relationship: PartyRelationship): RoleForRepairer | undefined {
    const registry = new Map<RepairRole, new (party: Party) => PartyRole>([
      [RepairRole.GUARANTOR, Warranty],
      [RepairRole.CUSTOMER, Customer],
      [RepairRole.INSURER, ExtendedInsurance],
      [RepairRole.INSURED, Insured],
    ]);
    return new RoleObjectFactory(relationship, registry).getRole(
      RoleForRepairer,
    );
  }
}
