import { Injectable } from '@nestjs/common';

@Injectable()
export class AppProperties {
  private noOfTransitsForClaimAutomaticRefund = Number(
    process.env.CLAIM_AUTO_REFUND_TRANSITS ?? 10,
  );

  private automaticRefundForVipThreshold = Number(
    process.env.CLAIM_VIP_REFUND_LIMIT ?? 100,
  );

  private minNoOfCarsForEcoClass = Number(process.env.ECO_MIN_CARS ?? 3);

  private milesExpirationInDays = 365;

  private defaultMilesBonus = 10;

  public getAutomaticRefundForVipThreshold() {
    return this.automaticRefundForVipThreshold;
  }

  public getNoOfTransitsForClaimAutomaticRefund() {
    return this.noOfTransitsForClaimAutomaticRefund;
  }

  public setNoOfTransitsForClaimAutomaticRefund(
    noOfTransitsForClaimAutomaticRefund: number,
  ) {
    this.noOfTransitsForClaimAutomaticRefund =
      noOfTransitsForClaimAutomaticRefund;
  }

  public getMinNoOfCarsForEcoClass() {
    return this.minNoOfCarsForEcoClass;
  }

  public setMinNoOfCarsForEcoClass(minNoOfCarsForEcoClass: number) {
    this.minNoOfCarsForEcoClass = minNoOfCarsForEcoClass;
  }

  public getMilesExpirationInDays() {
    return this.milesExpirationInDays;
  }

  public getDefaultMilesBonus() {
    return this.defaultMilesBonus;
  }

  public setMilesExpirationInDays(milesExpirationInDays: number) {
    this.milesExpirationInDays = milesExpirationInDays;
  }

  public setDefaultMilesBonus(defaultMilesBonus: number) {
    this.defaultMilesBonus = defaultMilesBonus;
  }
}
