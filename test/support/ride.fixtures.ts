import { CarClass } from '../../src/carfleet/car-type.entity';
import { TransitService } from '../../src/service/transit.service';
import { aClient } from './client.fixtures';
import { anAddress } from './address.fixtures';
import type { createTestApplication } from './test-application';

type TestApplication = Awaited<ReturnType<typeof createTestApplication>>;

export class RideFixtures {
  constructor(private readonly application: TestApplication) {}

  public async requestRide() {
    const client = aClient();
    const from = anAddress();
    const to = anAddress();
    await this.application.orm.em.persist([client, from, to]).flush();
    const transit = await this.application.app
      .get(TransitService)
      ._createTransit(client.id, from, to, CarClass.REGULAR);
    return { id: transit.id, clientId: client.id, from, to };
  }

  public cancelRide(id: string) {
    return this.application.app.get(TransitService).cancelTransit(id);
  }

  public viewRide(id: string) {
    return this.application.app.get(TransitService).loadTransit(id);
  }
}
