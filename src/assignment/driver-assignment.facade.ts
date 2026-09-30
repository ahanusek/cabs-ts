import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { LockMode } from '@mikro-orm/core';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { DriverService } from '../driverfleet/driver.service';
import { DriverNotificationService } from '../notification/driver-notification.service';
import { Address } from '../geolocation/address/address.entity';
import { CarClass } from '../carfleet/car-type.entity';
import { DriverAssignment } from './driver-assignment.entity';
import { DriverFinder } from './driver-finder.service';

@Injectable()
export class DriverAssignmentFacade {
  constructor(
    private readonly em: EntityManager,
    private readonly finder: DriverFinder,
    private readonly drivers: DriverService,
    private readonly notifications: DriverNotificationService,
  ) {}

  @Transactional()
  public async create(
    requestId: string,
    from: Address,
    carClass: CarClass,
    now: number,
  ) {
    const assignment = new DriverAssignment(requestId, now);
    await this.em.persist(assignment).flush();
    await this.finder.findFor(assignment, from, carClass);
    await this.em.flush();
    return assignment;
  }
  @Transactional()
  public async search(requestId: string, from: Address, carClass: CarClass) {
    const assignment = await this.load(requestId);
    await this.finder.findFor(assignment, from, carClass);
    await this.em.flush();
    return assignment;
  }
  @Transactional()
  public async accept(requestId: string, driverId: string) {
    const assignment = await this.load(requestId);
    assignment.acceptBy(driverId);
    await this.drivers.reserve(driverId);
    await this.em.flush();
  }
  @Transactional()
  public async reject(requestId: string, driverId: string) {
    await this.drivers.ensureExists(driverId);
    (await this.load(requestId)).rejectBy(driverId);
    await this.em.flush();
  }
  @Transactional()
  public async cancel(requestId: string) {
    (await this.load(requestId)).cancel();
    await this.em.flush();
  }
  public async requireAssigned(requestId: string, driverId: string) {
    const assignment = await this.em.findOne(DriverAssignment, { requestId });
    if (assignment?.getAssignedDriver() !== driverId)
      throw new ForbiddenException('Driver is not assigned to this transit');
  }
  public async notifyPickupChanged(requestId: string) {
    const assignment = await this.em.findOne(DriverAssignment, { requestId });
    for (const driverId of assignment?.getProposedDrivers() ?? [])
      this.notifications.notifyAboutChangedTransitAddress(driverId, requestId);
  }
  public async notifyDestinationChanged(requestId: string) {
    const driverId = (
      await this.em.findOne(DriverAssignment, { requestId })
    )?.getAssignedDriver();
    if (driverId)
      this.notifications.notifyAboutChangedTransitAddress(driverId, requestId);
  }
  private async load(requestId: string) {
    const assignment = await this.em.findOne(
      DriverAssignment,
      { requestId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    if (!assignment) throw new NotFoundException('Assignment does not exist');
    return assignment;
  }
}
