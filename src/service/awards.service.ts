import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { AwardsAccountDto } from '../dto/awards-account.dto';
import { AwardedMiles } from '../entity/awarded-miles.entity';
import { AwardsAccount } from '../entity/awards-account.entity';
import { Client, Type } from '../entity/client.entity';
import { Transit } from '../entity/transit.entity';
import { ClientRepository } from '../repository/client.repository';
import { TransitRepository } from '../repository/transit.repository';
import { AwardsAccountRepository } from '../repository/awards-account.repository';
import { AwardedMilesRepository } from '../repository/awarded-miles.repository';
import { AppProperties } from '../config/app-properties.config';
import { ConstantUntil } from '../loyalty/miles/constant-until';
import { requireMilesAmount } from '../loyalty/miles/miles';
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
    const account = new AwardsAccount();
    account.setClient(await this.getClient(clientId));
    await this.em.persist(account).flush();
  }

  public async activateAccount(clientId: string): Promise<void> {
    const account = await this.getAccountForClient(clientId);
    account.setActive(true);
    await this.em.flush();
  }

  public async deactivateAccount(clientId: string): Promise<void> {
    const account = await this.getAccountForClient(clientId);
    account.setActive(false);
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
    if (!account.isAwardActive()) return null;
    const expiration = dayjs()
      .add(this.properties.getMilesExpirationInDays(), 'days')
      .valueOf();
    const miles = new AwardedMiles();
    miles.setClient(account.getClient());
    miles.setTransit(transit);
    miles.setMiles(
      new ConstantUntil(this.properties.getDefaultMilesBonus(), expiration),
    );
    account.increaseTransactions();
    await this.em.persist(miles).flush();
    return miles;
  }

  @Transactional()
  public async registerNonExpiringMiles(
    clientId: string,
    amount: number,
  ): Promise<AwardedMiles> {
    const account = await this.getAccountForClient(clientId);
    const miles = new AwardedMiles();
    miles.setClient(account.getClient());
    miles.setMiles(ConstantUntil.forever(amount));
    account.increaseTransactions();
    await this.em.persist(miles).flush();
    return miles;
  }

  public async calculateBalance(clientId: string): Promise<number> {
    const client = await this.getClient(clientId);
    const miles = await this.miles.findAllByClient(client);
    const now = Date.now();
    return miles.reduce(
      (balance, grant) => balance + grant.getMilesAmount(now),
      0,
    );
  }

  @Transactional()
  public async removeMiles(clientId: string, amount: number): Promise<void> {
    requireMilesAmount(amount);
    const account = await this.getAccountForClient(clientId);
    if (
      !account.isAwardActive() ||
      (await this.calculateBalance(clientId)) < amount
    ) {
      throw new NotAcceptableException(
        'Insufficient miles or inactive account',
      );
    }
    const client = account.getClient();
    await this.em.populate(client, ['claims']);
    const grants = await this.miles.findAllByClient(client);
    const transitCount = await this.transits.count({ client });
    grants.sort(this.chooseStrategy(client, transitCount));
    this.consume(grants, amount, Date.now());
    await this.em.flush();
  }

  @Transactional()
  public async transferMiles(
    fromClientId: string,
    toClientId: string,
    amount: number,
  ): Promise<void> {
    requireMilesAmount(amount);
    const from = await this.getAccountForClient(fromClientId);
    const to = await this.getAccountForClient(toClientId);
    if (
      !from.isAwardActive() ||
      (await this.calculateBalance(fromClientId)) < amount
    )
      return;
    if (from.id === to.id || amount === 0) return;
    const grants = await this.miles.findAllByClient(from.getClient());
    const now = Date.now();
    let remaining = amount;
    for (const grant of grants) {
      if (remaining === 0) break;
      const transferred = Math.min(grant.getMilesAmount(now), remaining);
      if (transferred === 0) continue;
      grant.subtract(transferred, now);
      const received = new AwardedMiles();
      received.setClient(to.getClient());
      received.setDate(grant.getDate());
      received.setMiles(
        new ConstantUntil(transferred, grant.getExpirationDate()),
      );
      this.em.persist(received);
      remaining -= transferred;
    }
    from.increaseTransactions();
    to.increaseTransactions();
    await this.em.flush();
  }

  private consume(grants: AwardedMiles[], amount: number, now: number): void {
    let remaining = amount;
    for (const grant of grants) {
      if (remaining === 0) break;
      const consumed = Math.min(grant.getMilesAmount(now), remaining);
      grant.subtract(consumed, now);
      remaining -= consumed;
    }
  }

  private chooseStrategy(client: Client, transitCount: number) {
    const byDate = (a: AwardedMiles, b: AwardedMiles) =>
      a.getDate() - b.getDate();
    const byExpiration = (a: AwardedMiles, b: AwardedMiles) =>
      a.getExpirationDate() - b.getExpirationDate();
    const nonExpiringLast = (a: AwardedMiles, b: AwardedMiles) =>
      Number(a.cantExpire()) - Number(b.cantExpire());
    if (client.getClaims().length >= 3)
      return (a: AwardedMiles, b: AwardedMiles) => byExpiration(b, a);
    if (
      client.getType() === Type.VIP ||
      (transitCount >= 15 && dayjs().day() === 0)
    ) {
      return (a: AwardedMiles, b: AwardedMiles) =>
        nonExpiringLast(a, b) || byExpiration(a, b);
    }
    if (transitCount >= 15)
      return (a: AwardedMiles, b: AwardedMiles) =>
        nonExpiringLast(a, b) || byDate(a, b);
    return byDate;
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
