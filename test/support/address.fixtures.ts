import { Address } from '../../src/entity/address.entity';

export function anAddress(): Address {
  const address = new Address('Poland', 'Warsaw', 'Prosta', 1);
  address.setName(address.id);
  address.setPostalCode('00-001');
  address.setHash();
  return address;
}
