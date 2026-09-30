import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientRepository } from './client.repository';
import { Client, PaymentType, Type } from './client.entity';
import { ClientDto } from './client.dto';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: ClientRepository,
  ) {}

  public async registerClient(
    name: string,
    lastName: string,
    type: Type,
    paymentType: PaymentType,
  ) {
    const client = new Client();
    client.setName(name);
    client.setLastName(lastName);
    client.setType(type);
    client.setDefaultPaymentType(paymentType);
    await this.clientRepository.getEntityManager().persist(client).flush();
    return client;
  }

  public async changeDefaultPaymentType(
    clientId: string,
    paymentType: PaymentType,
  ) {
    const client = await this.clientRepository.findOne({ id: clientId });
    if (!client) {
      throw new NotFoundException('Client does not exists, id = ' + clientId);
    }
    client.setDefaultPaymentType(paymentType);
    await this.clientRepository.getEntityManager().flush();
  }

  public async upgradeToVIP(clientId: string) {
    const client = await this.clientRepository.findOne({ id: clientId });
    if (!client) {
      throw new NotFoundException('Client does not exists, id = ' + clientId);
    }
    client.setType(Type.VIP);
    await this.clientRepository.getEntityManager().flush();
  }

  public async downgradeToRegular(clientId: string) {
    const client = await this.clientRepository.findOne({ id: clientId });
    if (!client) {
      throw new NotFoundException('Client does not exists, id = ' + clientId);
    }
    client.setType(Type.NORMAL);
    await this.clientRepository.getEntityManager().flush();
  }

  public async load(id: string) {
    const client = await this.clientRepository.findOne({ id });
    if (!client) {
      throw new NotFoundException('Client does not exists, id = ' + id);
    }
    return new ClientDto(client);
  }
}
