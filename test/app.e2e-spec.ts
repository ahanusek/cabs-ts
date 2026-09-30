import { DriverLicense } from '../src/driverfleet/driver-license';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import request from 'supertest';
import {
  Driver,
  DriverStatus,
  DriverType,
} from '../src/driverfleet/driver.entity';
import { DriverPosition } from '../src/entity/driver-position.entity';
import { DriverPositionRepository } from '../src/repository/driver-position.repository';
import { AppModule } from '../src/app.module';

// The dedicated database is configured before importing AppModule.
describe('Client API with PostgreSQL', () => {
  let app: INestApplication;
  let orm: MikroORM;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    orm = app.get(MikroORM);
    await orm.schema.refresh();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('persists a registered client across HTTP requests', async () => {
    const registered = await request(app.getHttpServer())
      .post('/clients')
      .send({
        name: 'Jan',
        lastName: 'Kowalski',
        type: 'normal',
        defaultPaymentType: 'pre_paid',
      });
    const loaded = await request(app.getHttpServer()).get(
      `/clients/${registered.body.id}`,
    );
    expect({ status: loaded.status, client: loaded.body }).toEqual({
      status: 200,
      client: expect.objectContaining({
        name: 'Jan',
        lastName: 'Kowalski',
        type: 'normal',
      }),
    });
  });

  it('rejects invalid payment types at the HTTP boundary', async () => {
    const response = await request(app.getHttpServer()).post('/clients').send({
      name: 'Jan',
      lastName: 'Kowalski',
      type: 'normal',
      defaultPaymentType: 'invalid',
    });
    expect(response.status).toBe(400);
  });

  it('loads timestamps as numbers after clearing the identity map', async () => {
    const { em, positions } = await recordPositions();
    const position = await em.findOneOrFail(DriverPosition, positions[0].id);
    expect(position.getSeenAt()).toBe(1700000000000);
  });

  it('aggregates recent positions and loads the driver for assignment', async () => {
    const { em, driver } = await recordPositions();
    const repository = em.getRepository(
      DriverPosition,
    ) as DriverPositionRepository;
    const positions = await repository.findAverageDriverPositionSince(
      50,
      54,
      19,
      23,
      1700000000000,
    );
    const position = positions.find(
      (item) => item.getDriver().id === driver.id,
    )!;
    expect({
      latitude: position.getLatitude(),
      longitude: position.getLongitude(),
      seenAt: position.getSeenAt(),
      status: position.getDriver().getStatus(),
    }).toEqual({
      latitude: 52,
      longitude: 21,
      seenAt: 1700000001000,
      status: DriverStatus.ACTIVE,
    });
  });

  async function recordPositions() {
    const em = orm.em.fork();
    const driver = new Driver();
    driver.setFirstName('Jan');
    driver.setLastName('Kowalski');
    driver.setDriverLicense(DriverLicense.withLicense('FARME100165AB5EW'));
    driver.setStatus(DriverStatus.ACTIVE);
    driver.setType(DriverType.REGULAR);
    const positions = [0, 1].map((index) => {
      const position = new DriverPosition();
      position.setDriver(driver);
      position.setLatitude(51 + index * 2);
      position.setLongitude(20 + index * 2);
      position.setSeenAt(1700000000000 + index * 1000);
      return position;
    });
    await em.persist(positions).flush();
    em.clear();
    return { em, driver, positions };
  }
});
