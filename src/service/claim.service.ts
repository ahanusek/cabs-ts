import { ClaimsResolver, WhoToAsk } from '../claims/claims-resolver.entity';
import { Money } from '../money/money';
import { EntityManager } from '@mikro-orm/postgresql';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ClientRepository } from '../repository/client.repository';
import { TransitRepository } from '../repository/transit.repository';
import { AppProperties } from '../config/app-properties.config';
import { ClaimRepository } from '../repository/claim.repository';
import { ClaimNumberGenerator } from './claim-number-generator.service';
import { AwardsService } from './awards.service';
import { ClientNotificationService } from './client-notification.service';
import { DriverNotificationService } from './driver-notification.service';
import { ClaimDto } from '../dto/claim.dto';
import { Claim, ClaimStatus, CompletionMode } from '../entity/claim.entity';
import { Type, Client } from '../entity/client.entity';
import { Transit } from '../entity/transit.entity';

@Injectable()
export class ClaimService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: ClientRepository,
    @InjectRepository(Transit)
    private transitRepository: TransitRepository,
    @InjectRepository(Claim)
    private claimRepository: ClaimRepository,
    private claimNumberGenerator: ClaimNumberGenerator,
    private awardsService: AwardsService,
    private clientNotificationService: ClientNotificationService,
    private driverNotificationService: DriverNotificationService,
    private appProperties: AppProperties,
    private readonly em: EntityManager,
  ) {}

  public async create(claimDTO: ClaimDto): Promise<Claim> {
    let claim = new Claim();
    claim.setCreationDate(Date.now());
    claim.setClaimNo(await this.claimNumberGenerator.generate(claim));
    claim = await this.update(claimDTO, claim);
    return claim;
  }

  public async find(id: string): Promise<Claim> {
    const claim = await this.claimRepository.findOne({ id });
    if (!claim) {
      throw new NotFoundException('Claim does not exists');
    }
    return claim;
  }

  public async update(claimDTO: ClaimDto, claim: Claim) {
    const client = await this.clientRepository.findOne({
      id: claimDTO.getClientId(),
    });
    const transit = await this.transitRepository.findOne({
      id: claimDTO.getTransitId(),
    });
    if (client == null) {
      throw new NotFoundException('Client does not exists');
    }
    if (transit == null) {
      throw new NotFoundException('Transit does not exists');
    }
    if (claimDTO.isDraft()) {
      claim.setStatus(ClaimStatus.DRAFT);
    } else {
      claim.setStatus(ClaimStatus.NEW);
    }
    claim.setOwner(client);
    claim.setTransit(transit);
    claim.setCreationDate(Date.now());
    claim.setReason(claimDTO.getReason());
    claim.setIncidentDescription(claimDTO.getIncidentDescription());
    await this.claimRepository.getEntityManager().persist(claim).flush();
    return claim;
  }

  public async setStatus(newStatus: ClaimStatus, id: string) {
    const claim = await this.find(id);
    claim.setStatus(newStatus);
    await this.claimRepository.getEntityManager().flush();
    return claim;
  }

  @Transactional()
  public async tryToResolveAutomatically(id: string): Promise<Claim> {
    const claim = await this.find(id);
    let resolver = await this.em.findOne(ClaimsResolver, {
      clientId: claim.getOwner().id,
    });
    if (!resolver) {
      const previousClaims = await this.claimRepository.find(
        { owner: claim.getOwner(), id: { $ne: id } },
        { populate: ['transit'] },
      );
      resolver = new ClaimsResolver(claim.getOwner().id, [
        ...new Set(previousClaims.map((previous) => previous.getTransit().id)),
      ]);
      this.em.persist(resolver);
    }
    const count = await this.transitRepository.count({
      client: claim.getOwner(),
    });
    const result = resolver.resolve(claim, count, {
      vipThreshold: Money.fromMajor(
        this.appProperties.getAutomaticRefundForVipThreshold(),
      ),
      minimumTransits:
        this.appProperties.getNoOfTransitsForClaimAutomaticRefund(),
    });
    claim.setStatus(result.status);
    claim.setChangeDate(Date.now());
    claim.setCompletionDate(Date.now());
    claim.setCompletionMode(
      result.status === ClaimStatus.REFUNDED
        ? CompletionMode.AUTOMATIC
        : CompletionMode.MANUAL,
    );
    if (result.status === ClaimStatus.REFUNDED) {
      this.clientNotificationService.notifyClientAboutRefund(
        claim.getClaimNo(),
        claim.getOwner().id,
      );
      if (claim.getOwner().getType() === Type.VIP)
        await this.awardsService.registerSpecialMiles(claim.getOwner().id, 10);
    }
    if (result.whoToAsk === WhoToAsk.DRIVER && claim.getTransit().getDriver()) {
      this.driverNotificationService.askDriverForDetailsAboutClaim(
        claim.getClaimNo(),
        claim.getTransit().getDriver()!.id,
      );
    }
    if (result.whoToAsk === WhoToAsk.CLIENT) {
      this.clientNotificationService.askForMoreInformation(
        claim.getClaimNo(),
        claim.getOwner().id,
      );
    }
    await this.em.flush();
    return claim;
  }
}
