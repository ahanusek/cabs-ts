import { EntityRepository } from '@mikro-orm/postgresql';
import { ContractAttachment } from '../entity/contract-attachment.entity';
import { Contract } from '../entity/contract.entity';

export class ContractAttachmentRepository extends EntityRepository<ContractAttachment> {
  public async findByContract(
    contract: Contract,
  ): Promise<ContractAttachment[]> {
    return this.find({ contract });
  }
}
