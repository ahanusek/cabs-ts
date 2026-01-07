import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MikroORM } from '@mikro-orm/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Sync database schema (development only)
  const orm = app.get(MikroORM);
  await orm.getSchemaGenerator().ensureDatabase();
  await orm.getSchemaGenerator().updateSchema();

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
