import { Money } from '../../money/money';
import { Parts } from '../parts';
import { MaintenanceJob, RepairJob } from './jobs';
import { EmployeeDriverWithLeasedCar, EmployeeDriverWithOwnCar } from './users';
import { JobDoer } from './job-doer';

const allParts = new Set(Object.values(Parts));
const repair = new RepairJob(allParts, new Money(50000));

describe('Legacy repair hierarchy', () => {
  it('covers all requested parts under a full warranty', () => {
    const employee = new EmployeeDriverWithOwnCar({
      coveredParts: allParts,
      coverageRatio: 100,
    });
    expect(employee.doJob(repair)).toEqual({
      decision: 'accepted',
      totalCost: Money.ZERO,
      acceptedParts: allParts,
    });
  });

  it('applies a partial warranty', () => {
    const employee = new EmployeeDriverWithOwnCar({
      coveredParts: new Set([Parts.ENGINE]),
      coverageRatio: 50,
    });
    expect(employee.doJob(repair)).toEqual({
      decision: 'accepted',
      totalCost: new Money(25000),
      acceptedParts: new Set([Parts.ENGINE]),
    });
  });

  it('redirects a leased car to its leasing company', () => {
    expect(
      new EmployeeDriverWithLeasedCar('leasing-company').doJob(repair),
    ).toEqual({ decision: 'redirection', shouldHandleBy: 'leasing-company' });
  });

  it('rejects unsupported jobs', () => {
    expect(() =>
      new EmployeeDriverWithLeasedCar('leasing-company').doJob(
        new MaintenanceJob(),
      ),
    ).toThrow('Unsupported');
  });

  it('loads the user through the injected repository', async () => {
    const employee = new EmployeeDriverWithOwnCar({
      coveredParts: allParts,
      coverageRatio: 100,
    });
    const jobs = new JobDoer({ get: async () => employee });
    expect(await jobs.repair('employee', repair)).toEqual({
      decision: 'accepted',
      totalCost: Money.ZERO,
      acceptedParts: allParts,
    });
  });
});
