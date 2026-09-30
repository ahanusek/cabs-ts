export interface ReportDriver {
  id: string;
  firstName: string;
  lastName: string;
  driverLicense: string;
  photo: string | null;
  status: string;
  type: string;
}

export interface ReportSession {
  loggedAt: number;
  loggedOutAt: number | null;
  platesNumber: string;
  carClass: string;
  carBrand: string;
}

export interface ReportClaim {
  claimID: string;
  clientId: string;
  transitId: string;
  reason: string;
  incidentDescription: string | null;
  _isDraft: boolean;
  creationDate: number;
  completionDate: number | null;
  changeDate: number | null;
  completionMode: string | null;
  status: string;
  claimNo: string;
}

export interface ReportAddress {
  country: string;
  district: string | null;
  city: string;
  street: string;
  buildingNumber: number;
  additionalNumber: number | null;
  postalCode: string;
  name: string;
}

export interface ReportTransit {
  id: string;
  tariff: string;
  status: string;
  factor: number | null;
  distance: number;
  kmRate: number;
  price?: number;
  driverFee?: number;
  estimatedPrice?: number;
  baseFee: number;
  date: number;
  dateTime: number;
  published: number;
  acceptedAt: number | null;
  started: number | null;
  completeAt: number | null;
  claimDto?: ReportClaim;
  proposedDrivers: ReportDriver[];
  to: ReportAddress;
  from: ReportAddress;
  carClass: string;
  clientDto: {
    id: string;
    type: string;
    name: string;
    lastName: string;
    defaultPaymentType: string;
    clientType: string;
  };
}

export interface DriverReportView {
  driverDto: ReportDriver;
  attributes: { name: string; value: string }[];
  sessions: { session: ReportSession; transits: ReportTransit[] }[];
}
