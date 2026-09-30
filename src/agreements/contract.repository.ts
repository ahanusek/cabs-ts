import { EntityRepository } from '@mikro-orm/postgresql';
import { Contract } from './contract.entity';

export class ContractRepository extends EntityRepository<Contract> {
  public async findByPartnerName(partnerName: string): Promise<Contract[]> {
    return this.find({ partnerName });
  }
}
