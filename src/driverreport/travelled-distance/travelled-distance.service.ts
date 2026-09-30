import { Injectable, BadRequestException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Transactional } from '@mikro-orm/decorators/legacy';
import type { PositionSample } from './position-sample';
import { DistanceCalculator } from '../../service/distance-calculator.service';
import { Distance } from '../../distance/distance';
import { TimeSlot, FIVE_MINUTES } from './time-slot';
import { TravelledDistance } from './travelled-distance.entity';

@Injectable()
export class TravelledDistanceService {
  constructor(
    private readonly em: EntityManager,
    private readonly calculator: DistanceCalculator,
  ) {}

  public async calculateDistance(
    driverId: string,
    from: number,
    to: number,
  ): Promise<Distance> {
    if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) {
      throw new BadRequestException('Invalid time range');
    }
    const left = TimeSlot.containing(from);
    const right = TimeSlot.containing(to);
    const rows = await this.em.execute<{ kilometers: number }[]>(
      `
      select coalesce(sum(kilometers), 0) as kilometers from travelled_distance
      where driver_id = ? and beginning >= ? and beginning < ?`,
      [driverId, left.beginning, right.end],
    );
    return Distance.ofKm(Number(rows[0].kilometers));
  }

  @Transactional()
  public async addPosition(
    driverId: string,
    position: PositionSample,
  ): Promise<void> {
    // Serialize updates per driver, including concurrent creation of the first slot.
    await this.em.execute('select pg_advisory_xact_lock(hashtext(?))', [
      `distance:${driverId}`,
    ]);
    const slot = TimeSlot.containing(position.seenAt);
    let current = await this.em.findOne(
      TravelledDistance,
      { driverId, beginning: slot.beginning },
      { refresh: true },
    );
    if (current) current.addPosition(position);
    else current = new TravelledDistance(driverId, slot, position);
    const next = await this.em.findOne(
      TravelledDistance,
      { driverId, beginning: slot.end },
      { refresh: true },
    );
    const previous = await this.em.findOne(
      TravelledDistance,
      { driverId, beginning: slot.beginning - FIVE_MINUTES },
      { refresh: true },
    );
    current.recalculate(this.calculator, next?.firstPosition());
    previous?.recalculate(this.calculator, current.firstPosition());
    await this.em.persist(current).flush();
  }
}
