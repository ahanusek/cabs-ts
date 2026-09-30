import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CompletedTransitEdge } from './completed-transit-edge.entity';
import type { TransitCompleted } from './transit-completed';

const MAXIMUM_STOP_MILLISECONDS = 15 * 60 * 1000;

@Injectable()
export class GraphTransitAnalyzer {
  constructor(private readonly em: EntityManager) {}

  public async addTransitBetweenAddresses(
    event: TransitCompleted,
  ): Promise<void> {
    await this.em.upsert(CompletedTransitEdge, new CompletedTransitEdge(event));
  }

  public async analyze(clientId: string, fromHash: string): Promise<string[]> {
    const routes = await this.em.execute<{ hashes: string[] }[]>(
      `
      with recursive routes(hashes, transit_ids, last_address, complete_at) as (
        select array[from_hash, to_hash]::text[], array[transit_id]::uuid[], to_hash, complete_at
        from completed_transit_edge where client_id = ? and from_hash = ?
        union all
        select routes.hashes || edge.to_hash, routes.transit_ids || edge.transit_id,
          edge.to_hash, edge.complete_at
        from routes join completed_transit_edge edge on edge.from_hash = routes.last_address
          and edge.client_id = ?
          and edge.started >= routes.complete_at
          and edge.started <= routes.complete_at + ?
          and not (edge.transit_id = any(routes.transit_ids))
      )
      select hashes from routes
      order by cardinality(hashes) desc, array_to_string(transit_ids, ',') asc limit 1`,
      [clientId, fromHash, clientId, MAXIMUM_STOP_MILLISECONDS],
    );
    return routes[0]?.hashes ?? [];
  }
}
