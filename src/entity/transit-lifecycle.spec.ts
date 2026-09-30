import { MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Transit, Status } from './transit.entity';
import { Distance } from '../distance/distance';
import { anActiveDriver, anAddress } from '../../test/support/fixtures';

describe('Transit lifecycle without a database', () => {
  let orm: MikroORM;
  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: 'metadata_only',
      metadataProvider: ReflectMetadataProvider,
      entities: [Transit],
    });
  });
  afterAll(() => orm?.close());

  function draft() {
    const transit = new Transit();
    transit.setStatus(Status.DRAFT);
    transit.setDateTime(new Date('2021-04-12T12:00:00').getTime());
    return transit;
  }

  it('moves from request through assignment to completion', () => {
    const transit = draft();
    const driver = anActiveDriver();
    transit.publishAt(1000);
    transit.proposeTo(driver);
    transit.acceptBy(driver, 2000);
    transit.start(3000);
    transit.complete(4000, anAddress(), Distance.ofKm(10));
    expect([
      transit.getStatus(),
      transit.getPrice()!.toInt(),
      transit.getCompleteAt(),
    ]).toEqual([Status.COMPLETED, 1900, 4000]);
  });

  it('cannot start before a driver accepts', () => {
    expect(() => draft().start(1000)).toThrow();
  });

  it('cannot be accepted by an unproposed driver', () => {
    expect(() => draft().acceptBy(anActiveDriver(), 1000)).toThrow();
  });

  it('does not propose the same ride twice to a driver', () => {
    const transit = draft();
    const driver = anActiveDriver();
    transit.proposeTo(driver);
    transit.proposeTo(driver);
    expect(transit.getAwaitingDriversResponses()).toBe(1);
  });

  it('records a rejection once', () => {
    const transit = draft();
    const driver = anActiveDriver();
    transit.proposeTo(driver);
    transit.rejectBy(driver);
    transit.rejectBy(driver);
    expect([
      transit.canProposeTo(driver),
      transit.getAwaitingDriversResponses(),
    ]).toEqual([false, 0]);
  });

  it('rejects moving pickup further than 250 meters', () => {
    expect(() =>
      draft().changePickupTo(anAddress(), Distance.ofKm(10), 0.251),
    ).toThrow();
  });

  it('allows at most three pickup changes', () => {
    const transit = draft();
    for (let change = 0; change < 3; change++)
      transit.changePickupTo(anAddress(), Distance.ofKm(10), 0.25);
    expect(() =>
      transit.changePickupTo(anAddress(), Distance.ofKm(10), 0.25),
    ).toThrow();
  });

  it('cannot cancel a ride already in progress', () => {
    const transit = draft();
    transit.setStatus(Status.IN_TRANSIT);
    expect(() => transit.cancel()).toThrow();
  });
});
