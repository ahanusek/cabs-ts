import {
  Entity,
  PrimaryKey,
  Property,
  Enum,
} from '@mikro-orm/decorators/legacy';
import { ForbiddenException } from '@nestjs/common';
export enum AssignmentStatus {
  WAITING = 'waiting',
  ON_THE_WAY = 'on_the_way',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}
const ASSIGNMENT_TIMEOUT_MS = 5 * 60 * 1000;

@Entity()
export class DriverAssignment {
  @PrimaryKey({ type: 'uuid' }) public requestId: string;
  @Property({ type: 'bigint', runtimeType: 'number' })
  private publishedAt: number;
  @Enum(() => AssignmentStatus) private status = AssignmentStatus.WAITING;
  @Property({ type: 'uuid', nullable: true }) private assignedDriver:
    string | null = null;
  @Property({ type: 'json' }) private proposedDrivers: string[] = [];
  @Property({ type: 'json' }) private rejectedDrivers: string[] = [];
  constructor(requestId: string, publishedAt: number) {
    this.requestId = requestId;
    this.publishedAt = publishedAt;
  }
  public cancel() {
    this.requireWaiting();
    this.status = AssignmentStatus.CANCELLED;
  }
  public canProposeTo(driverId: string) {
    return (
      this.status === AssignmentStatus.WAITING &&
      !this.rejectedDrivers.includes(driverId)
    );
  }
  public proposeTo(driverId: string) {
    if (this.canProposeTo(driverId) && !this.proposedDrivers.includes(driverId))
      this.proposedDrivers = [...this.proposedDrivers, driverId];
  }
  public rejectBy(driverId: string) {
    this.requireWaiting();
    if (
      this.proposedDrivers.includes(driverId) &&
      !this.rejectedDrivers.includes(driverId)
    )
      this.rejectedDrivers = [...this.rejectedDrivers, driverId];
  }
  public acceptBy(driverId: string) {
    this.requireWaiting();
    if (
      !this.proposedDrivers.includes(driverId) ||
      this.rejectedDrivers.includes(driverId)
    )
      throw new ForbiddenException('Driver cannot accept this transit');
    this.assignedDriver = driverId;
    this.status = AssignmentStatus.ON_THE_WAY;
  }
  public fail() {
    this.requireWaiting();
    this.status = AssignmentStatus.FAILED;
  }
  public isExpired(now: number) {
    return this.publishedAt + ASSIGNMENT_TIMEOUT_MS < now;
  }
  public getStatus() {
    return this.status;
  }
  public getAssignedDriver() {
    return this.assignedDriver;
  }
  public getProposedDrivers() {
    return [...this.proposedDrivers];
  }
  public getAwaitingResponses() {
    return this.status === AssignmentStatus.WAITING
      ? this.proposedDrivers.length - this.rejectedDrivers.length
      : 0;
  }
  private requireWaiting() {
    if (this.status !== AssignmentStatus.WAITING)
      throw new ForbiddenException('Assignment is no longer waiting');
  }
}
