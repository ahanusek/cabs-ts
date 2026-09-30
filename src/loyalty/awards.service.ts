import { ClientService } from '../service/client.service';
import { ClaimsQueries } from '../crm/claims/claims-queries';
import { TransitDetailsFacade } from '../transitdetails/transit-details.facade';

import { chooseMilesSpendingPolicy } from './miles-spending-policy';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { AwardsAccountDto } from './awards-account.dto';
import { AwardedMiles } from './awarded-miles.entity';
import { AwardsAccount } from './awards-account.entity';

import { AwardsAccountRepository } from './awards-account.repository';
import { AppProperties } from '../config/app-properties.config';
import dayjs from 'dayjs';

@Injectable()
export class AwardsService {
  constructor(
    private readonly clients: ClientService,
    private readonly claims: ClaimsQueries,
    private readonly details: TransitDetailsFacade,
    @InjectRepository(AwardsAccount)
    private readonly accounts: AwardsAccountRepository,
    private readonly properties: AppProperties,
    private readonly em: EntityManager,
  ) {}

  public async findBy(clientId: string): Promise<AwardsAccountDto> {
    return new AwardsAccountDto(
      await this.getAccountForClient(clientId),
      await this.clients.load(clientId),
    );
  }

  public async registerToProgram(clientId: string): Promise<void> {
    await this.clients.load(clientId);
    const account = new AwardsAccount(clientId);
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
    const now = Date.now();
    const expiration = dayjs(now)
      .add(this.properties.getMilesExpirationInDays(), 'days')
      .valueOf();
    const grant = account.addExpiringMiles(
      this.properties.getDefaultMilesBonus(),
      expiration,
      transitId,
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
    const client = await this.clients.load(clientId);
    const now = Date.now();
    account.remove(
      amount,
      now,
      chooseMilesSpendingPolicy({
        transitCount: await this.details.countByClient(clientId),
        claimCount: await this.claims.countByClient(clientId),
        clientType: client.getType(),
        moment: now,
      }),
    );
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

  private async getAccountForClient(clientId: string): Promise<AwardsAccount> {
    const account = await this.accounts.findByClient(clientId);
    if (!account)
      throw new NotFoundException(
        `Awards account for ${clientId} does not exist`,
      );
    return account;
  }
}
