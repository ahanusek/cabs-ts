import { Inject, Injectable } from '@nestjs/common';
import {
  PartyRelationshipRepository,
  type RelationshipStore,
} from '../party/party-relationship.repository';
import {
  RepairRoleFactory,
  type RepairRequest,
  type ResolveResult,
} from './repair-roles';

@Injectable()
export class RepairProcess {
  constructor(
    @Inject(PartyRelationshipRepository)
    private readonly relationships: RelationshipStore,
    private readonly roles: RepairRoleFactory,
  ) {}

  public async resolve(request: RepairRequest): Promise<ResolveResult> {
    const relationship = await this.relationships.findFor(
      request.vehicle,
      'repair',
    );
    const role = relationship && this.roles.from(relationship);
    return role ? role.handle(request) : { status: 'error' };
  }
}
