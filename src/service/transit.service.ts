import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ClientRepository } from '../repository/client.repository';
import { TransitRepository } from '../repository/transit.repository';
import { DriverRepository } from '../repository/driver.repository';
import { DriverPositionRepository } from '../repository/driver-position.repository';
import { DriverSessionRepository } from '../repository/driver-session.repository';
import { AddressRepository } from '../repository/address.repository';
import { AwardsService } from './awards.service';
import { DriverFeeService } from './driver-fee.service';
import { CarTypeService } from './car-type.service';
import { GeocodingService } from './geocoding.service';
import { InvoiceGenerator } from './invoice-generator.service';
import { DistanceCalculator } from './distance-calculator.service';
import { TransitDto } from '../dto/transit.dto';
import { AddressDto } from '../dto/address.dto';
import { CarClass } from '../entity/car-type.entity';
import { Address } from '../entity/address.entity';
import { Status, Transit } from '../entity/transit.entity';
import { DriverNotificationService } from './driver-notification.service';
import * as dayjs from 'dayjs';
import { Driver, DriverStatus } from '../entity/driver.entity';
import { DriverPositionV2Dto } from '../dto/driver-position-v2.dto';
import { CreateTransitDto } from '../dto/create-transit.dto';
import { Client } from '../entity/client.entity';
import { DriverSession } from '../entity/driver-session.entity';
import { DriverPosition } from '../entity/driver-position.entity';
import { Transactional } from '@mikro-orm/core';

@Injectable()
export class TransitService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: ClientRepository,
    @InjectRepository(Transit)
    private transitRepository: TransitRepository,
    @InjectRepository(Driver)
    private driverRepository: DriverRepository,
    @InjectRepository(DriverPosition)
    private driverPositionRepository: DriverPositionRepository,
    @InjectRepository(DriverSession)
    private driverSessionRepository: DriverSessionRepository,
    @InjectRepository(Address)
    private addressRepository: AddressRepository,
    private awardsService: AwardsService,
    private driverFeeService: DriverFeeService,
    private carTypeService: CarTypeService,
    private geocodingService: GeocodingService,
    private invoiceGenerator: InvoiceGenerator,
    private distanceCalculator: DistanceCalculator,
    private notificationService: DriverNotificationService,
  ) {}

  @Transactional()
  public async createTransit(transitDto: CreateTransitDto) {
    const from = await this.addressFromDto(new AddressDto(transitDto.from));
    const to = await this.addressFromDto(new AddressDto(transitDto.to));

    if (!from || !to) {
      throw new NotAcceptableException(
        'Cannot create transit for empty address',
      );
    }
    return this._createTransit(
      transitDto.clientId,
      from,
      to,
      transitDto.carClass,
    );
  }

  @Transactional()
  public async _createTransit(
    clientId: string,
    from: Address,
    to: Address,
    carClass: CarClass,
  ) {
    const client = await this.clientRepository.findOne({ id: clientId });

    if (!client) {
      throw new NotFoundException('Client does not exist, id = ' + clientId);
    }

    const transit = new Transit();

    // FIXME later: add some exceptions handling
    const geoFrom = this.geocodingService.geocodeAddress(from);
    const geoTo = this.geocodingService.geocodeAddress(to);

    transit.setClient(client);
    transit.setFrom(from);
    transit.setTo(to);
    transit.setCarType(carClass);
    transit.setStatus(Status.DRAFT);
    transit.setDateTime(Date.now());
    transit.setKm(
      this.distanceCalculator.calculateByMap(
        geoFrom[0],
        geoFrom[1],
        geoTo[0],
        geoTo[1],
      ),
    );

    await this.transitRepository.getEntityManager().persistAndFlush(transit);
    return transit;
  }

  @Transactional()
  public async _changeTransitAddressFrom(transitId: string, address: Address) {
    const newAddress = await this.addressRepository.saveAddress(address);
    const transit = await this.transitRepository.findOne({ id: transitId });

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    if (!newAddress) {
      throw new NotAcceptableException('Cannot process without address');
    }

    // FIXME later: add some exceptions handling
    const geoFromNew = this.geocodingService.geocodeAddress(newAddress);
    const geoFromOld = this.geocodingService.geocodeAddress(transit.getFrom());

    // https://www.geeksforgeeks.org/program-distance-two-points-earth/
    // The math module contains a function
    // named toRadians which converts from
    // degrees to radians.
    const lon1 = DistanceCalculator.degreesToRadians(geoFromNew[1]);
    const lon2 = DistanceCalculator.degreesToRadians(geoFromOld[1]);
    const lat1 = DistanceCalculator.degreesToRadians(geoFromNew[0]);
    const lat2 = DistanceCalculator.degreesToRadians(geoFromOld[0]);

    // Haversine formula
    const dlon = lon2 - lon1;
    const dlat = lat2 - lat1;
    const a =
      Math.pow(Math.sin(dlat / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);

    const c = 2 * Math.asin(Math.sqrt(a));

    // Radius of earth in kilometers. Use 3956 for miles
    const r = 6371;

    // calculate the result
    const distanceInKMeters = c * r;

    if (
      transit.getStatus() !== Status.DRAFT ||
      transit.getStatus() === Status.WAITING_FOR_DRIVER_ASSIGNMENT ||
      transit.getPickupAddressChangeCounter() > 2 ||
      distanceInKMeters > 0.25
    ) {
      throw new NotAcceptableException(
        "Address 'from' cannot be changed, id = " + transitId,
      );
    }

    transit.setFrom(newAddress);
    transit.setKm(
      this.distanceCalculator.calculateByMap(
        geoFromNew[0],
        geoFromNew[1],
        geoFromOld[0],
        geoFromOld[1],
      ),
    );
    transit.setPickupAddressChangeCounter(
      transit.getPickupAddressChangeCounter() + 1,
    );
    await this.transitRepository.getEntityManager().flush();

    for (const driver of transit.getProposedDrivers()) {
      await this.notificationService.notifyAboutChangedTransitAddress(
        driver.getId(),
        transitId,
      );
    }
  }

  public async changeTransitAddressTo(
    transitId: string,
    newAddress: AddressDto,
  ) {
    return this._changeTransitAddressTo(
      transitId,
      newAddress.toAddressEntity(),
    );
  }

  @Transactional()
  private async _changeTransitAddressTo(
    transitId: string,
    newAddress: Address,
  ) {
    const savedAddress = await this.addressRepository.saveAddress(newAddress);
    const transit = await this.transitRepository.findOne({ id: transitId });

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    if (transit.getStatus() === Status.COMPLETED) {
      throw new NotAcceptableException(
        "Address 'to' cannot be changed, id = " + transitId,
      );
    }

    // FIXME later: add some exceptions handling
    const geoFrom = this.geocodingService.geocodeAddress(transit.getFrom());
    const geoTo = this.geocodingService.geocodeAddress(savedAddress);
    transit.setTo(savedAddress);
    transit.setKm(
      this.distanceCalculator.calculateByMap(
        geoFrom[0],
        geoFrom[1],
        geoTo[0],
        geoTo[1],
      ),
    );

    const driver = transit.getDriver();
    await this.transitRepository.getEntityManager().flush();
    if (driver) {
      this.notificationService.notifyAboutChangedTransitAddress(
        driver.getId(),
        transitId,
      );
    }
  }

  public changeTransitAddressFrom(transitId: string, newAddress: AddressDto) {
    return this._changeTransitAddressFrom(
      transitId,
      newAddress.toAddressEntity(),
    );
  }

  @Transactional()
  public async cancelTransit(transitId: string) {
    const transit = await this.transitRepository.findOne({ id: transitId });

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    if (
      ![
        Status.DRAFT,
        Status.WAITING_FOR_DRIVER_ASSIGNMENT,
        Status.TRANSIT_TO_PASSENGER,
      ].includes(transit.getStatus())
    ) {
      throw new NotAcceptableException(
        'Transit cannot be cancelled, id = ' + transitId,
      );
    }

    const driver = transit.getDriver();
    if (driver) {
      this.notificationService.notifyAboutCancelledTransit(
        driver.getId(),
        transitId,
      );
    }

    transit.setStatus(Status.CANCELLED);
    transit.setDriver(null);
    transit.setKm(0);
    transit.setAwaitingDriversResponses(0);
    await this.transitRepository.getEntityManager().flush();
  }

  @Transactional()
  public async publishTransit(transitId: string) {
    const transit = await this.transitRepository.findOne({ id: transitId });

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    transit.setStatus(Status.WAITING_FOR_DRIVER_ASSIGNMENT);
    transit.setPublished(Date.now());
    await this.transitRepository.getEntityManager().flush();

    return this.findDriversForTransit(transitId);
  }

  // Abandon hope all ye who enter here...
  public async findDriversForTransit(transitId: string) {
    const transit = await this.transitRepository.findOne({ id: transitId });

    if (transit) {
      if (transit.getStatus() === Status.WAITING_FOR_DRIVER_ASSIGNMENT) {
        let distanceToCheck = 0;

        // Tested on production, works as expected.
        // If you change this code and the system will collapse AGAIN, I'll find you...
        while (true) {
          if (transit.getAwaitingDriversResponses() > 4) {
            return transit;
          }

          distanceToCheck++;

          // FIXME: to refactor when the final business logic will be determined
          if (
            dayjs(transit.getPublished())
              .add(300, 'seconds')
              .isBefore(dayjs()) ||
            distanceToCheck >= 20 ||
            // Should it be here? How is it even possible due to previous status check above loop?
            transit.getStatus() === Status.CANCELLED
          ) {
            transit.setStatus(Status.DRIVER_ASSIGNMENT_FAILED);
            transit.setDriver(null);
            transit.setKm(0);
            transit.setAwaitingDriversResponses(0);
            await this.transitRepository.getEntityManager().flush();
            return transit;
          }
          let geocoded: number[] = [0, 0];

          try {
            geocoded = this.geocodingService.geocodeAddress(transit.getFrom());
          } catch (e) {
            // Geocoding failed! Ask Jessica or Bryan for some help if needed.
          }

          const longitude = geocoded[1];
          const latitude = geocoded[0];

          //https://gis.stackexchange.com/questions/2951/algorithm-for-offsetting-a-latitude-longitude-by-some-amount-of-meters
          //Earth's radius, sphere
          //double R = 6378;
          const R = 6371; // Changed to 6371 due to Copy&Paste pattern from different source

          //offsets in meters
          const dn = distanceToCheck;
          const de = distanceToCheck;

          //Coordinate offsets in radians
          const dLat = dn / R;
          const dLon = de / (R * Math.cos((Math.PI * latitude) / 180));

          //Offset positions, decimal degrees
          const latitudeMin = latitude - (dLat * 180) / Math.PI;
          const latitudeMax = latitude + (dLat * 180) / Math.PI;
          const longitudeMin = longitude - (dLon * 180) / Math.PI;
          const longitudeMax = longitude + (dLon * 180) / Math.PI;

          let driversAvgPositions =
            await this.driverPositionRepository.findAverageDriverPositionSince(
              latitudeMin,
              latitudeMax,
              longitudeMin,
              longitudeMax,
              dayjs().subtract(5, 'minutes').valueOf(),
            );

          if (driversAvgPositions.length) {
            const comparator = (
              d1: DriverPositionV2Dto,
              d2: DriverPositionV2Dto,
            ) => {
              const a = Math.sqrt(
                Math.pow(latitude - d1.getLatitude(), 2) +
                  Math.pow(longitude - d1.getLongitude(), 2),
              );
              const b = Math.sqrt(
                Math.pow(latitude - d2.getLatitude(), 2) +
                  Math.pow(longitude - d2.getLongitude(), 2),
              );
              if (a < b) {
                return -1;
              }
              if (a > b) {
                return 1;
              }
              return 0;
            };
            driversAvgPositions.sort(comparator);
            driversAvgPositions = driversAvgPositions.slice(0, 20);

            const carClasses: CarClass[] = [];
            const activeCarClasses =
              await this.carTypeService.findActiveCarClasses();
            if (activeCarClasses.length === 0) {
              return transit;
            }
            if (transit.getCarType()) {
              if (activeCarClasses.includes(transit.getCarType())) {
                carClasses.push(transit.getCarType());
              } else {
                return transit;
              }
            } else {
              carClasses.push(...activeCarClasses);
            }

            const drivers = driversAvgPositions.map((item) => item.getDriver());

            const fetchedCars =
              await this.driverSessionRepository.findAllByLoggedOutAtNullAndDriverInAndCarClassIn(
                drivers,
                carClasses,
              );
            const activeDriverIdsInSpecificCar = fetchedCars.map((ds) =>
              ds.getDriver().getId(),
            );

            driversAvgPositions = driversAvgPositions.filter((dp) =>
              activeDriverIdsInSpecificCar.includes(dp.getDriver().getId()),
            );

            // Iterate across average driver positions
            for (const driverAvgPosition of driversAvgPositions) {
              const driver = driverAvgPosition.getDriver();
              if (
                driver.getStatus() === DriverStatus.ACTIVE &&
                !driver.getOccupied()
              ) {
                if (
                  !Array.from(transit.getDriversRejections()).includes(driver)
                ) {
                  transit.getProposedDrivers().push(driver);
                  transit.setAwaitingDriversResponses(
                    transit.getAwaitingDriversResponses() + 1,
                  );
                  await this.notificationService.notifyAboutPossibleTransit(
                    driver.getId(),
                    transitId,
                  );
                }
              } else {
                // Not implemented yet!
              }
            }

            await this.transitRepository.getEntityManager().flush();
          } else {
            // Next iteration, no drivers at specified area
            continue;
          }
        }
      } else {
        throw new NotAcceptableException(
          'Wrong status for transit id = ' + transitId,
        );
      }
    } else {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }
  }

  @Transactional()
  public async acceptTransit(driverId: string, transitId: string) {
    const driver = await this.driverRepository.findOne({ id: driverId });

    if (!driver) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    } else {
      const transit = await this.transitRepository.findOne({ id: transitId });

      if (!transit) {
        throw new NotFoundException(
          'Transit does not exist, id = ' + transitId,
        );
      } else {
        if (transit.getDriver()) {
          throw new NotAcceptableException(
            'Transit already accepted, id = ' + transitId,
          );
        } else {
          if (!Array.from(transit.getProposedDrivers()).includes(driver)) {
            throw new NotAcceptableException(
              'Driver out of possible drivers, id = ' + transitId,
            );
          } else {
            if (Array.from(transit.getDriversRejections()).includes(driver)) {
              throw new NotAcceptableException(
                'Driver out of possible drivers, id = ' + transitId,
              );
            } else {
              transit.setDriver(driver);
              transit.setAwaitingDriversResponses(0);
              transit.setAcceptedAt(Date.now());
              transit.setStatus(Status.TRANSIT_TO_PASSENGER);
              driver.setOccupied(true);
              await this.transitRepository.getEntityManager().flush();
            }
          }
        }
      }
    }
  }

  @Transactional()
  public async startTransit(driverId: string, transitId: string) {
    const driver = await this.driverRepository.findOne({ id: driverId });

    if (!driver) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    }

    const transit = await this.transitRepository.findOne({ id: transitId });

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    if (transit.getStatus() !== Status.TRANSIT_TO_PASSENGER) {
      throw new NotAcceptableException(
        'Transit cannot be started, id = ' + transitId,
      );
    }

    transit.setStatus(Status.IN_TRANSIT);
    transit.setStarted(Date.now());
    await this.transitRepository.getEntityManager().flush();
  }

  @Transactional()
  public async rejectTransit(driverId: string, transitId: string) {
    const driver = await this.driverRepository.findOne({ id: driverId });

    if (!driver) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    }

    const transit = await this.transitRepository.findOne({ id: transitId });

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    transit.getDriversRejections().push(driver);
    transit.setAwaitingDriversResponses(
      transit.getAwaitingDriversResponses() - 1,
    );
    await this.transitRepository.getEntityManager().flush();
  }

  public completeTransitFromDto(
    driverId: string,
    transitId: string,
    destinationAddress: AddressDto,
  ) {
    return this.completeTransit(
      driverId,
      transitId,
      destinationAddress.toAddressEntity(),
    );
  }

  @Transactional()
  public async completeTransit(
    driverId: string,
    transitId: string,
    destinationAddress: Address,
  ) {
    await this.addressRepository.saveAddress(destinationAddress);
    const driver = await this.driverRepository.findOne({ id: driverId });

    if (!driver) {
      throw new NotFoundException('Driver does not exist, id = ' + driverId);
    }

    const transit = await this.transitRepository.findOne({ id: transitId });

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    if (transit.getStatus() === Status.IN_TRANSIT) {
      // FIXME later: add some exceptions handling
      const geoFrom = this.geocodingService.geocodeAddress(transit.getFrom());
      const geoTo = this.geocodingService.geocodeAddress(transit.getTo());

      transit.setTo(destinationAddress);
      transit.setKm(
        this.distanceCalculator.calculateByMap(
          geoFrom[0],
          geoFrom[1],
          geoTo[0],
          geoTo[1],
        ),
      );
      transit.setStatus(Status.COMPLETED);
      transit.calculateFinalCosts();
      driver.setOccupied(false);
      transit.setCompleteAt(Date.now());
      const driverFee = await this.driverFeeService.calculateDriverFee(
        transitId,
      );
      transit.setDriversFee(driverFee ?? 0);
      await this.awardsService.registerMiles(
        transit.getClient().getId(),
        transitId,
      );
      await this.transitRepository.getEntityManager().flush();
      await this.invoiceGenerator.generate(
        transit.getPrice() ?? 0,
        transit.getClient().getName() + ' ' + transit.getClient().getLastName(),
      );
    } else {
      throw new NotAcceptableException(
        'Cannot complete Transit, id = ' + transitId,
      );
    }
  }

  public async loadTransit(transitId: string) {
    const transit = await this.transitRepository.findOne({ id: transitId });

    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    return new TransitDto(transit);
  }

  private async addressFromDto(addressDTO: AddressDto) {
    const address = addressDTO.toAddressEntity();
    return this.addressRepository.saveAddress(address);
  }
}
