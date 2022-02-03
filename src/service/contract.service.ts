import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContractRepository } from '../repository/contract.repository';
import { ContractAttachmentRepository } from '../repository/contract-attachment.repository';
import { ContractDto } from '../dto/contract.dto';
import { Contract, ContractStatus } from '../entity/contract.entity';
import {
  ContractAttachment,
  ContractAttachmentStatus,
} from '../entity/contract-attachment.entity';
import { ContractAttachmentDto } from '../dto/contract-attachment.dto';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(ContractRepository)
    private contractRepository: ContractRepository,
    @InjectRepository(ContractAttachmentRepository)
    private contractAttachmentRepository: ContractAttachmentRepository,
  ) {}

  public async createContract(contractDto: ContractDto) {
    const contract = new Contract();
    contract.setPartnerName(contractDto.getPartnerName());
    const partnerContractsCount =
      (
        await this.contractRepository.findByPartnerName(
          contractDto.getPartnerName(),
        )
      ).length + 1;
    contract.setSubject(contractDto.getSubject());
    contract.setContractNo(
      'C/' + partnerContractsCount + '/' + contractDto.getPartnerName(),
    );
    return this.contractRepository.save(contract);
  }

  public async acceptContract(id: string) {
    const contract = await this.find(id);
    const attachments = await this.contractAttachmentRepository.findByContract(
      contract,
    );
    if (
      attachments.every(
        (a) =>
          a.getStatus() === ContractAttachmentStatus.ACCEPTED_BY_BOTH_SIDES,
      )
    ) {
      contract.setStatus(ContractStatus.ACCEPTED);
    } else {
      throw new NotAcceptableException(
        'Not all attachments accepted by both sides',
      );
    }
  }

  public async rejectContract(id: string) {
    const contract = await this.find(id);
    contract.setStatus(ContractStatus.REJECTED);
    await this.contractRepository.save(contract);
  }

  public async rejectAttachment(attachmentId: string) {
    const contractAttachment = await this.contractAttachmentRepository.findOne(
      attachmentId,
    );
    if (!contractAttachment) {
      throw new NotFoundException('Contract attachment does not exist');
    }
    contractAttachment.setStatus(ContractAttachmentStatus.REJECTED);
    await this.contractAttachmentRepository.save(contractAttachment);
  }

  public async acceptAttachment(attachmentId: string) {
    const contractAttachment = await this.contractAttachmentRepository.findOne(
      attachmentId,
    );
    if (!contractAttachment) {
      throw new NotFoundException('Contract attachment does not exist');
    }

    if (
      contractAttachment.getStatus() ===
        ContractAttachmentStatus.ACCEPTED_BY_ONE_SIDE ||
      contractAttachment.getStatus() ===
        ContractAttachmentStatus.ACCEPTED_BY_BOTH_SIDES
    ) {
      contractAttachment.setStatus(
        ContractAttachmentStatus.ACCEPTED_BY_BOTH_SIDES,
      );
    } else {
      contractAttachment.setStatus(
        ContractAttachmentStatus.ACCEPTED_BY_ONE_SIDE,
      );
    }

    await this.contractAttachmentRepository.save(contractAttachment);
  }

  public async find(id: string) {
    const contract = await this.contractRepository.findOne(id);
    if (!contract) {
      throw new NotFoundException('Contract does not exist');
    }
    return contract;
  }

  public async findDto(id: string) {
    return new ContractDto(await this.find(id));
  }

  public async proposeAttachment(
    contractId: string,
    contractAttachmentDto: ContractAttachmentDto,
  ) {
    const contract = await this.find(contractId);
    const contractAttachment = new ContractAttachment();
    contractAttachment.setContract(contract);
    contractAttachment.setData(contractAttachmentDto.getData());
    await this.contractAttachmentRepository.save(contractAttachment);
    contract.getAttachments().add(contractAttachment);
    return new ContractAttachmentDto(contractAttachment);
  }

  public async removeAttachment(contractId: string, attachmentId: string) {
    //TODO sprawdzenie czy nalezy do kontraktu (JIRA: II-14455)
    await this.contractAttachmentRepository.delete(attachmentId);
  }
}
