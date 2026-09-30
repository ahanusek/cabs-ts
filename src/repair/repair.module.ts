import { Module } from '@nestjs/common';
import { PartyRelationshipRepository } from '../party/party-relationship.repository';
import { RepairRoleFactory } from './repair-roles';
import { RepairContractManager } from './repair-contract.manager';
import { RepairProcess } from './repair-process';

@Module({
  providers: [
    PartyRelationshipRepository,
    RepairRoleFactory,
    RepairContractManager,
    RepairProcess,
  ],
  exports: [RepairContractManager, RepairProcess],
})
export class RepairModule {}
