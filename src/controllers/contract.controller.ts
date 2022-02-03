import { ContractService } from '../service/contract.service';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ContractDto } from '../dto/contract.dto';
import { ContractAttachmentDto } from '../dto/contract-attachment.dto';

@Controller('contracts')
export class ContractController {
  constructor(private contractService: ContractService) {}

  @Post()
  public async create(@Body() contractDto: ContractDto) {
    const created = await this.contractService.createContract(contractDto);
    return new ContractDto(created);
  }

  @Get(':contractId')
  public async find(@Param('contractId') contractId: string) {
    const contract = await this.contractService.findDto(contractId);
    return contract;
  }

  @Post(':contractId/attachment')
  public async proposeAttachment(
    @Param('contractId') contractId: string,
    @Body() contractAttachmentDto: ContractAttachmentDto,
  ) {
    const dto = await this.contractService.proposeAttachment(
      contractId,
      contractAttachmentDto,
    );
    return dto;
  }

  @Post(':contractId/attachment/:attachmentId/reject')
  public async rejectAttachment(
    @Param('contractId') contractId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    await this.contractService.rejectAttachment(attachmentId);
  }

  @Post(':contractId/attachment/:attachmentId/accept')
  public async acceptAttachment(
    @Param('contractId') contractId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    await this.contractService.acceptAttachment(attachmentId);
  }

  @Delete(':contractId/attachment/:attachmentId')
  public async removeAttachment(
    @Param('contractId') contractId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    await this.contractService.removeAttachment(contractId, attachmentId);
  }

  @Post(':contractId/accept')
  public async acceptContract(@Param('contractId') contractId: string) {
    await this.contractService.acceptContract(contractId);
  }

  @Post(':contractId/reject')
  public async rejectContract(@Param('contractId') contractId: string) {
    await this.contractService.rejectContract(contractId);
  }
}
