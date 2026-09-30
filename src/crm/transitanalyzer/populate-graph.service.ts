import { EntityManager } from '@mikro-orm/postgresql';
import { TransitDetails } from '../../ride/details/transit-details.entity';
import { Status } from '../../ride/details/status';
import { Injectable } from '@nestjs/common';

import { GraphTransitAnalyzer } from './graph-transit-analyzer';

const PAGE_SIZE = 100;

export interface GraphMigrationResult {
  projected: number;
  skippedTransitIds: string[];
}

@Injectable()
export class PopulateGraphService {
  constructor(
    private readonly em: EntityManager,
    private readonly graph: GraphTransitAnalyzer,
  ) {}

  public async populate(): Promise<GraphMigrationResult> {
    const result: GraphMigrationResult = {
      projected: 0,
      skippedTransitIds: [],
    };
    let afterId: string | undefined;
    for (;;) {
      const page = await this.em.find(
        TransitDetails,
        {
          status: Status.COMPLETED,
          ...(afterId ? { transitId: { $gt: afterId } } : {}),
        },
        { orderBy: { transitId: 'asc' }, limit: PAGE_SIZE },
      );
      if (page.length === 0) break;
      for (const transit of page) {
        const started = transit.view.started;
        const completeAt = transit.completeAt;
        if (started == null || completeAt == null || completeAt < started) {
          result.skippedTransitIds.push(transit.transitId);
          continue;
        }
        await this.graph.addTransitBetweenAddresses({
          transitId: transit.transitId,
          clientId: transit.clientId,
          fromHash: transit.fromHash,
          toHash: transit.toHash,
          started,
          completeAt,
        });
        result.projected++;
      }
      afterId = page[page.length - 1].transitId;
    }
    return result;
  }
}
