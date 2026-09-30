import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MikroORM } from '@mikro-orm/postgresql';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV !== 'production') {
    const orm = app.get(MikroORM);
    await orm.schema.ensureDatabase();
    await orm.schema.update();
  }

  app.enableShutdownHooks();

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
