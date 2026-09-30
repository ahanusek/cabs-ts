export interface TransitCompleted {
  readonly transitId: string;
  readonly clientId: string;
  readonly fromHash: string;
  readonly toHash: string;
  readonly started: number;
  readonly completeAt: number;
}
