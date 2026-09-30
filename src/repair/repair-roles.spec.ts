import { Party } from '../party/party.entity';
import { PartyRelationship } from '../party/party-relationship.entity';
import { RepairRole, RepairRoleFactory, Warranty } from './repair-roles';

describe('Repair role factory', () => {
  it('finds the repairer role regardless of which side handles the repair', () => {
    const relation = new PartyRelationship(
      'repair',
      { party: new Party('vehicle'), role: RepairRole.CUSTOMER },
      { party: new Party('manufacturer'), role: RepairRole.GUARANTOR },
    );
    expect(new RepairRoleFactory().from(relation)).toBeInstanceOf(Warranty);
  });

  it('reports unsupported persisted role names', () => {
    const relation = new PartyRelationship(
      'repair',
      { party: new Party('vehicle'), role: 'unknown' },
      { party: new Party('manufacturer'), role: RepairRole.GUARANTOR },
    );
    expect(() => new RepairRoleFactory().from(relation)).toThrow(
      'Unknown party role',
    );
  });
});
