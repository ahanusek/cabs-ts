import { Job, JobResult, RepairJob, SignedContract } from './jobs';

// This hierarchy is the course's starting point for replacing inheritance with roles.
export abstract class LegacyUser {
  public doJob(job: Job): JobResult {
    if (job instanceof RepairJob) return this.handleRepair(job);
    throw new Error(`Unsupported job for ${this.constructor.name}`);
  }

  protected handleRepair(_job: RepairJob): JobResult {
    throw new Error(`Repairs are unsupported for ${this.constructor.name}`);
  }
}

export class EmployeeDriver extends LegacyUser {}

export class EmployeeDriverWithOwnCar extends EmployeeDriver {
  constructor(private readonly contract: SignedContract) {
    super();
  }

  protected handleRepair(job: RepairJob): JobResult {
    const acceptedParts = new Set(
      [...job.parts].filter((part) => this.contract.coveredParts.has(part)),
    );
    const coveredCost = job.estimatedValue.percentage(
      this.contract.coverageRatio,
    );
    return {
      decision: 'accepted',
      totalCost: job.estimatedValue.subtract(coveredCost),
      acceptedParts,
    };
  }
}

export class EmployeeDriverWithLeasedCar extends EmployeeDriver {
  constructor(private readonly leasingCompanyId: string) {
    super();
  }

  protected handleRepair(_job: RepairJob): JobResult {
    return { decision: 'redirection', shouldHandleBy: this.leasingCompanyId };
  }
}
