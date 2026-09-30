import { ContractAttachmentData } from '../entity/contract-attachment-data.entity';
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
    const contract = await this.find(id);
    const payloads = await this.em.find(ContractAttachmentData, {
      attachmentId: { $in: contract.getAttachmentIds() },
    });
    const dataById = new Map(
      payloads.map((payload) => [payload.attachmentId, payload]),
    );
    const attachments = contract.getAttachments().map((attachment) => {
      const payload = dataById.get(attachment.id);
      if (!payload)
        throw new NotFoundException('Attachment content does not exist');
      return new ContractAttachmentDto(attachment, payload.getData(), id);
    });
    return new ContractDto(contract, attachments);
  }

  @Transactional()
  public async proposeAttachment(
    contractId: string,
    dto: CreateContractAttachmentDto,
  ): Promise<ContractAttachmentDto> {
    const contract = await this.find(contractId);
    const attachment = contract.proposeAttachment();
    const data = Buffer.from(dto.data, 'base64');
    this.em.persist(new ContractAttachmentData(attachment.id, data));
    await this.em.flush();
    return new ContractAttachmentDto(attachment, data, contractId);
  }

  @Transactional()
  public async removeAttachment(
    contractId: string,
    attachmentId: string,
  ): Promise<void> {
    (await this.find(contractId)).removeAttachment(attachmentId);
    await this.em.nativeDelete(ContractAttachmentData, { attachmentId });
    await this.em.flush();
  }
}
