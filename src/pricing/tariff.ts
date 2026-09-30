import { Distance } from '../distance/distance';
import { Money } from '../money/money';

export class Tariff {
  private constructor(
    private readonly kmRate: number,
    private readonly name: string,
    private readonly baseFee: number,
  ) {}

  public static ofTime(time: Date): Tariff {
    const month = time.getMonth();
    const day = time.getDate();
    const weekday = time.getDay();
    const hour = time.getHours();
    const newYear =
      (month === 11 && day === 31) || (month === 0 && day === 1 && hour <= 6);
    if (newYear) return new Tariff(3.5, 'Sylwester', 11);

    const weekendNight =
      (weekday === 5 && hour >= 17) ||
      (weekday === 6 && (hour <= 6 || hour >= 17)) ||
      (weekday === 0 && hour <= 6);
    if (weekendNight) return new Tariff(2.5, 'Weekend+', 10);
    if (weekday === 0 || weekday === 6) return new Tariff(1.5, 'Weekend', 8);
    return new Tariff(1, 'Standard', 9);
  }

  public calculateCost(distance: Distance): Money {
    return Money.fromMajor(distance.toKm() * this.kmRate + this.baseFee);
  }

  public getName(): string {
    return this.name;
  }
  public getKmRate(): number {
    return this.kmRate;
  }
  public getBaseFee(): number {
    return this.baseFee;
  }
}
