import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { Contract } from './contract.entity';
import { ContractAttachment } from './contract-attachment.entity';
import { ContractAttachmentData } from './contract-attachment-data.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Contract,
      ContractAttachment,
      ContractAttachmentData,
    ]),
  ],
  providers: [ContractService],
  controllers: [ContractController],
  exports: [ContractService],
})
export class AgreementsModule {}
