import { ClientController } from './client.controller';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ClientService } from './client.service';
import { Client } from './client.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Client])],
  providers: [ClientService],
  controllers: [ClientController],
  exports: [ClientService],
})
export class ClientAccessModule {}
