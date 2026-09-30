import { Money } from '../../money/money';
import { Parts } from '../parts';

export abstract class Job {}
export class MaintenanceJob extends Job {}

export class RepairJob extends Job {
  constructor(
    public readonly parts: ReadonlySet<Parts>,
    public readonly estimatedValue: Money,
  ) {
    super();
  }
}

export type JobResult =
  | {
      decision: 'accepted';
      totalCost: Money;
      acceptedParts: ReadonlySet<Parts>;
    }
  | {
      decision: 'redirection';
      shouldHandleBy: string;
    };

export interface SignedContract {
  coveredParts: ReadonlySet<Parts>;
  coverageRatio: number;
}
