import { Job, JobResult } from './jobs';
import { LegacyUser } from './users';

export interface LegacyUserRepository {
  get(id: string): Promise<LegacyUser>;
}

export class JobDoer {
  constructor(private readonly users: LegacyUserRepository) {}

  public async repair(userId: string, job: Job): Promise<JobResult> {
    return (await this.users.get(userId)).doJob(job);
  }
}
