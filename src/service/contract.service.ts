import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { EntityManager } from '@mikro-orm/postgresql';
import { ContractRepository } from '../repository/contract.repository';
import { ContractDto } from '../dto/contract.dto';
import { Contract } from '../entity/contract.entity';
import { ContractAttachmentDto } from '../dto/contract-attachment.dto';
import { CreateContractDto } from '../dto/create-contract.dto';
import { CreateContractAttachmentDto } from '../dto/create-contract-attachment.dto';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract) private readonly contracts: ContractRepository,
    private readonly em: EntityManager,
  ) {}

  public async createContract(dto: CreateContractDto): Promise<Contract> {
    const sequence =
      (await this.contracts.count({ partnerName: dto.partnerName })) + 1;
    const contract = new Contract(
      dto.partnerName,
      dto.subject,
      `C/${sequence}/${dto.partnerName}`,
    );
    await this.em.persist(contract).flush();
    return contract;
  }

  @Transactional()
  public async acceptContract(id: string): Promise<void> {
    (await this.find(id)).accept(Date.now());
    await this.em.flush();
  }

  @Transactional()
  public async rejectContract(id: string): Promise<void> {
    (await this.find(id)).reject(Date.now());
    await this.em.flush();
  }

  @Transactional()
  public async acceptAttachment(
    contractId: string,
    attachmentId: string,
  ): Promise<void> {
    (await this.find(contractId)).acceptAttachment(attachmentId, Date.now());
    await this.em.flush();
  }

  @Transactional()
  public async rejectAttachment(
    contractId: string,
    attachmentId: string,
  ): Promise<void> {
    (await this.find(contractId)).rejectAttachment(attachmentId, Date.now());
    await this.em.flush();
  }

  public async find(id: string): Promise<Contract> {
    const contract = await this.contracts.findOne({ id });
    if (!contract) throw new NotFoundException('Contract does not exist');
    return contract;
  }

  public async findDto(id: string): Promise<ContractDto> {
    return new ContractDto(await this.find(id));
  }

  @Transactional()
  public async proposeAttachment(
    contractId: string,
    dto: CreateContractAttachmentDto,
  ): Promise<ContractAttachmentDto> {
    const contract = await this.find(contractId);
    const attachment = contract.proposeAttachment(dto.data);
    await this.em.flush();
    return new ContractAttachmentDto(attachment, contractId);
  }

  @Transactional()
  public async removeAttachment(
    contractId: string,
    attachmentId: string,
  ): Promise<void> {
    (await this.find(contractId)).removeAttachment(attachmentId);
    await this.em.flush();
  }
}
