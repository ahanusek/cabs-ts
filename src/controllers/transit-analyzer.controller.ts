import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { GraphTransitAnalyzer } from '../transitanalyzer/graph-transit-analyzer';
import { AddressRepository } from '../repository/address.repository';
import { Address } from '../entity/address.entity';
import { AnalyzedAddressesDto } from '../dto/analyzed-addresses.dto';
import { AddressDto } from '../dto/address.dto';

@Controller('transitAnalyze')
export class TransitAnalyzerController {
  constructor(
    private readonly graph: GraphTransitAnalyzer,
    @InjectRepository(Address) private readonly addresses: AddressRepository,
  ) {}

  @Get(':clientId/:addressId')
  public async analyze(
    @Param('clientId') clientId: string,
    @Param('addressId') addressId: string,
  ): Promise<AnalyzedAddressesDto> {
    const from = await this.addresses.findOne({ id: addressId });
    if (!from) throw new NotFoundException('Address does not exist');
    const hashes = await this.graph.analyze(clientId, from.getHash());
    const addresses = await this.addresses.find({ hash: { $in: hashes } });
    const byHash = new Map(
      addresses.map((address) => [address.getHash(), address]),
    );
    return new AnalyzedAddressesDto(
      hashes.map((hash) => {
        const address = byHash.get(hash);
        if (!address)
          throw new NotFoundException('Analyzed address does not exist');
        return new AddressDto(address);
      }),
    );
  }
}
