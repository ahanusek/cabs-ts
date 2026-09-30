import { DomainEvents } from '../../common/domain-events';
import { TransitDetailsFacade } from '../../transitdetails/transit-details.facade';
import { ClaimsResolver, WhoToAsk } from './claims-resolver.entity';
import { Money } from '../../money/money';
import { EntityManager } from '@mikro-orm/postgresql';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ClientRepository } from '../../repository/client.repository';

import { AppProperties } from '../../config/app-properties.config';
import { ClaimRepository } from './claim.repository';
import { ClaimNumberGenerator } from './claim-number-generator.service';

import { ClientNotificationService } from '../../notification/client-notification.service';
import { DriverNotificationService } from '../../notification/driver-notification.service';
import { ClaimDto } from './claim.dto';
import { Claim, ClaimStatus, CompletionMode } from './claim.entity';
import { Client } from '../../entity/client.entity';

@Injectable()
export class ClaimService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: ClientRepository,
    private readonly details: TransitDetailsFacade,
    @InjectRepository(Claim)
    private claimRepository: ClaimRepository,
    private claimNumberGenerator: ClaimNumberGenerator,
    private readonly events: DomainEvents,
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
    await this.details.find(claimDTO.getTransitId());
    if (client == null) {
      throw new NotFoundException('Client does not exists');
    }
    if (claimDTO.isDraft()) {
      claim.setStatus(ClaimStatus.DRAFT);
    } else {
      claim.setStatus(ClaimStatus.NEW);
    }
    claim.setOwner(client.id, client.getType());
    claim.setTransitId(claimDTO.getTransitId());
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
      clientId: claim.clientId,
    });
    if (!resolver) {
      const previousClaims = await this.claimRepository.find({
        clientId: claim.clientId,
        id: { $ne: id },
      });
      resolver = new ClaimsResolver(claim.clientId, [
        ...new Set(previousClaims.map((previous) => previous.transitId)),
      ]);
      this.em.persist(resolver);
    }
    const count = await this.details.countByClient(claim.clientId);
    const transit = await this.details.find(claim.transitId);
    const result = resolver.resolve(
      claim,
      {
        numberOfTransits: count,
        price: Money.fromMajor(transit.view.price ?? 0),
      },
      {
        vipThreshold: Money.fromMajor(
          this.appProperties.getAutomaticRefundForVipThreshold(),
        ),
        minimumTransits:
          this.appProperties.getNoOfTransitsForClaimAutomaticRefund(),
      },
    );
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
        claim.clientId,
      );
      await this.events.publish({
        type: 'claim-refunded',
        clientId: claim.clientId,
        clientType: claim.clientType,
      });
    }
    if (result.whoToAsk === WhoToAsk.DRIVER && transit.driverId) {
      this.driverNotificationService.askDriverForDetailsAboutClaim(
        claim.getClaimNo(),
        transit.driverId,
      );
    }
    if (result.whoToAsk === WhoToAsk.CLIENT) {
      this.clientNotificationService.askForMoreInformation(
        claim.getClaimNo(),
        claim.clientId,
      );
    }
    await this.em.flush();
    return claim;
  }
}
