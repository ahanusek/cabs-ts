import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Status, Transit } from '../../entity/transit.entity';
import { TransitRepository } from '../../repository/transit.repository';
import { GraphTransitAnalyzer } from './graph-transit-analyzer';

const PAGE_SIZE = 100;

export interface GraphMigrationResult {
  projected: number;
  skippedTransitIds: string[];
}

@Injectable()
export class PopulateGraphService {
  constructor(
    @InjectRepository(Transit) private readonly transits: TransitRepository,
    private readonly graph: GraphTransitAnalyzer,
  ) {}

  public async populate(): Promise<GraphMigrationResult> {
    const result: GraphMigrationResult = {
      projected: 0,
      skippedTransitIds: [],
    };
    let afterId: string | undefined;
    for (;;) {
      const page = await this.transits.find(
        {
          status: Status.COMPLETED,
          ...(afterId ? { id: { $gt: afterId } } : {}),
        },
        { orderBy: { id: 'asc' }, limit: PAGE_SIZE },
      );
      if (page.length === 0) break;
      for (const transit of page) {
        const started = transit.getStarted();
        const completeAt = transit.getCompleteAt();
        if (started == null || completeAt == null || completeAt < started) {
          result.skippedTransitIds.push(transit.id);
          continue;
        }
        await this.graph.addTransitBetweenAddresses({
          transitId: transit.id,
          clientId: transit.getClient().id,
          fromHash: transit.getFrom().getHash(),
          toHash: transit.getTo().getHash(),
          started,
          completeAt,
        });
        result.projected++;
      }
      afterId = page[page.length - 1].id;
    }
    return result;
  }
}
