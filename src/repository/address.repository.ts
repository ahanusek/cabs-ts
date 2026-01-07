import { EntityRepository } from '@mikro-orm/postgresql';
import { Address } from '../entity/address.entity';

export class AddressRepository extends EntityRepository<Address> {
  public async saveAddress(address: Address): Promise<Address> {
    if (!address.getId()) {
      const existingAddress = await this.findOne({ hash: address.getHash() });
      if (existingAddress) {
        return existingAddress;
      }
    }

    await this.getEntityManager().persistAndFlush(address);
    return address;
  }

  public async findByHash(hash: string): Promise<Address | null> {
    return this.findOne({ hash });
  }
}
