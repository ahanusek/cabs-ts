import { Module } from '@nestjs/common';
import { DomainEvents } from './domain-events';

@Module({
  imports: [],
  providers: [DomainEvents],
  controllers: [],
  exports: [DomainEvents],
})
export class DomainEventsModule {}
