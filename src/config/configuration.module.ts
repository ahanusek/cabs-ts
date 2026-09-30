import { Module } from '@nestjs/common';
import { AppProperties } from './app-properties.config';

@Module({
  imports: [],
  providers: [AppProperties],
  controllers: [],
  exports: [AppProperties],
})
export class ConfigurationModule {}
