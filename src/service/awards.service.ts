import { AwardsAccountDto } from '../dto/awards-account.dto';
import { AwardedMiles } from '../entity/awarded-miles.entity';

export interface AwardsService {
  findBy: (clientId: string) => Promise<AwardsAccountDto>;

  registerToProgram: (clientId: string) => Promise<void>;

  activateAccount: (clientId: string) => Promise<void>;

  deactivateAccount: (clientId: string) => Promise<void>;

  registerMiles: (clientId: string, transitId: string) => Promise<AwardedMiles>;

  registerSpecialMiles: (
    clientId: string,
    miles: number,
  ) => Promise<AwardedMiles>;

  removeMiles: (clientId: string, miles: number) => Promise<void>;

  calculateBalance: (clientId: string) => Promise<number>;

  transferMiles: (
    fromClientId: string,
    toClientId: string,
    miles: number,
  ) => Promise<void>;
}
