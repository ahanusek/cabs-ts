import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { AwardsAccountDto } from '../dto/awards-account.dto';
import { AwardedMiles } from '../entity/awarded-miles.entity';
import { AwardsAccount } from '../entity/awards-account.entity';
import { Client } from '../entity/client.entity';
import { Transit } from '../entity/transit.entity';
import { ClientRepository } from '../repository/client.repository';
import { TransitRepository } from '../repository/transit.repository';
import { AwardsAccountRepository } from '../repository/awards-account.repository';
import { AwardedMilesRepository } from '../repository/awarded-miles.repository';
import { AppProperties } from '../config/app-properties.config';
import dayjs from 'dayjs';

@Injectable()
export class AwardsService {
  constructor(
    @InjectRepository(Client) private readonly clients: ClientRepository,
    @InjectRepository(Transit) private readonly transits: TransitRepository,
    @InjectRepository(AwardsAccount)
    private readonly accounts: AwardsAccountRepository,
    @InjectRepository(AwardedMiles)
    private readonly miles: AwardedMilesRepository,
    private readonly properties: AppProperties,
    private readonly em: EntityManager,
  ) {}

  public async findBy(clientId: string): Promise<AwardsAccountDto> {
    return new AwardsAccountDto(await this.getAccountForClient(clientId));
  }

  public async registerToProgram(clientId: string): Promise<void> {
    const account = new AwardsAccount(await this.getClient(clientId));
    await this.em.persist(account).flush();
  }

  public async activateAccount(clientId: string): Promise<void> {
    const account = await this.getAccountForClient(clientId);
    account.activate();
    await this.em.flush();
  }

  public async deactivateAccount(clientId: string): Promise<void> {
    const account = await this.getAccountForClient(clientId);
    account.deactivate();
    await this.em.flush();
  }

  @Transactional()
  public async registerMiles(
    clientId: string,
    transitId: string,
  ): Promise<AwardedMiles | null> {
    const account = await this.getAccountForClient(clientId);
    const transit = await this.transits.findOne({ id: transitId });
    if (!transit)
      throw new NotFoundException(`Transit ${transitId} does not exist`);
    const now = Date.now();
    const expiration = dayjs(now)
      .add(this.properties.getMilesExpirationInDays(), 'days')
      .valueOf();
    const grant = account.addExpiringMiles(
      this.properties.getDefaultMilesBonus(),
      expiration,
      transit,
      now,
    );
    await this.em.flush();
    return grant;
  }

  @Transactional()
  public async registerNonExpiringMiles(
    clientId: string,
    amount: number,
  ): Promise<AwardedMiles> {
    const account = await this.getAccountForClient(clientId);
    const grant = account.addNonExpiringMiles(amount, Date.now());
    await this.em.flush();
    return grant;
  }

  public async calculateBalance(clientId: string): Promise<number> {
    return (await this.getAccountForClient(clientId)).calculateBalance(
      Date.now(),
    );
  }

  @Transactional()
  public async removeMiles(clientId: string, amount: number): Promise<void> {
    const account = await this.getAccountForClient(clientId);
    const client = account.getClient();
    await this.em.populate(client, ['claims']);
    account.remove(amount, Date.now(), {
      transitCount: await this.transits.count({ client }),
      claimCount: client.getClaims().length,
      clientType: client.getType(),
    });
    await this.em.flush();
  }

  @Transactional()
  public async transferMiles(
    fromClientId: string,
    toClientId: string,
    amount: number,
  ): Promise<void> {
    const from = await this.getAccountForClient(fromClientId);
    const to = await this.getAccountForClient(toClientId);
    from.moveMilesTo(to, amount, Date.now());
    await this.em.flush();
  }

  private async getClient(id: string): Promise<Client> {
    const client = await this.clients.findOne({ id });
    if (!client) throw new NotFoundException(`Client ${id} does not exist`);
    return client;
  }

  private async getAccountForClient(clientId: string): Promise<AwardsAccount> {
    const account = await this.accounts.findByClient(
      await this.getClient(clientId),
    );
    if (!account)
      throw new NotFoundException(
        `Awards account for ${clientId} does not exist`,
      );
    return account;
  }
}
