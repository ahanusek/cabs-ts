import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { GraphTransitAnalyzer } from './graph-transit-analyzer';
import { GraphTransitSubscriber } from './graph-transit.subscriber';
import { PopulateGraphService } from './populate-graph.service';
import { TransitAnalyzerController } from './transit-analyzer.controller';
import { CompletedTransitEdge } from './completed-transit-edge.entity';

import { Address } from '../../geolocation/address/address.entity';
import { DomainEventsModule } from '../../common/domain-events-module';

@Module({
  imports: [
    DomainEventsModule,
    MikroOrmModule.forFeature([CompletedTransitEdge, Address]),
  ],
  providers: [
    GraphTransitAnalyzer,
    GraphTransitSubscriber,
    PopulateGraphService,
  ],
  controllers: [TransitAnalyzerController],
  exports: [GraphTransitAnalyzer, GraphTransitSubscriber, PopulateGraphService],
})
export class TransitAnalysisModule {}
