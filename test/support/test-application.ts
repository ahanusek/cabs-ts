import { Test } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/postgresql';
import { RequestContext } from '@mikro-orm/core';
import { AppModule } from '../../src/app.module';

export async function createTestApplication() {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = module.createNestApplication();
  const orm = app.get(MikroORM);
  await orm.schema.refresh();
  await app.init();
  return {
    app,
    orm,
    run: <T>(work: () => Promise<T>): Promise<T> =>
      RequestContext.create(orm.em, work),
    close: () => app.close(),
  };
}
