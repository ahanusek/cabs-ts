import 'dotenv/config';
import { defineConfig } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

const config = defineConfig({
  metadataProvider: ReflectMetadataProvider,
  preferTs: false,
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT
    ? parseInt(process.env.DATABASE_PORT, 10)
    : 5432,
  user: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  dbName: process.env.DATABASE_NAME || 'cabs',
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  debug: process.env.NODE_ENV === 'development',
});

export default config;
