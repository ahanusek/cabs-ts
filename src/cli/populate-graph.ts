import { NestFactory } from '@nestjs/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { RequestContext } from '@mikro-orm/core';
import { AppModule } from '../app.module';
import { PopulateGraphService } from '../crm/transitanalyzer/populate-graph.service';

async function populateGraph(): Promise<void> {
  const application = await NestFactory.createApplicationContext(AppModule);
  try {
    const orm = application.get(MikroORM);
    const result = await RequestContext.create(orm.em, () =>
      application.get(PopulateGraphService).populate(),
    );
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await application.close();
  }
}

void populateGraph().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
