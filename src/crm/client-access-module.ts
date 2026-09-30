import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ClientService } from '../service/client.service';
import { Client } from '../entity/client.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Client])],
  providers: [ClientService],
  controllers: [],
  exports: [ClientService],
})
export class ClientAccessModule {}
