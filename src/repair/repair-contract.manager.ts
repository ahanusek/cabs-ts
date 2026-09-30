import { Inject, Injectable } from '@nestjs/common';
import { PartyId } from '../party/party-id';
import {
  PartyRelationshipRepository,
  type RelationshipStore,
} from '../party/party-relationship.repository';
import { RepairRole } from './repair-roles';

@Injectable()
export class RepairContractManager {
  constructor(
    @Inject(PartyRelationshipRepository)
    private readonly relationships: RelationshipStore,
  ) {}

  public manufacturerWarrantyRegistered(
    guarantor: PartyId,
    vehicle: PartyId,
  ): Promise<void> {
    return this.relationships.put(
      'repair',
      { id: guarantor, role: RepairRole.GUARANTOR },
      { id: vehicle, role: RepairRole.CUSTOMER },
    );
  }

  public extendedWarrantyContractSigned(
    insurer: PartyId,
    vehicle: PartyId,
  ): Promise<void> {
    return this.relationships.put(
      'repair',
      { id: insurer, role: RepairRole.INSURER },
      { id: vehicle, role: RepairRole.INSURED },
    );
  }
}
