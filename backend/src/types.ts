export type OrderStatus = "COMPLETED" | "CANCELLED" | "RETURNED" | string;

export interface SaleRecord {
  orderId: string;
  orderDate: Date;
  orderStatus: OrderStatus;
  vehicleId: string;
  price: number;
  make: string;
  model: string;
  version: string;
  color: string;
  modelYear: number;
  mileageKilometers: number;
}

export interface ModelPriceAggregate {
  make: string;
  model: string;
  saleCount: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  medianPrice: number;
  avgMileageKilometers: number;
  /** Index 0 = January … 11 = December; 0 means no sales that month */
  monthlyMedians: number[];
}

export interface PriceSummary {
  from: string;
  to: string;
  statusesIncluded: OrderStatus[];
  totalSales: number;
  distinctModels: number;
  overallAvgPrice: number;
  overallMedianPrice: number;
  overallMinPrice: number;
  overallMaxPrice: number;
}

export interface MakeCount {
  make: string;
  saleCount: number;
}

export interface PricesResponse {
  summary: PriceSummary;
  makes: MakeCount[];
  models: ModelPriceAggregate[];
}

export interface MetaResponse {
  dateMin: string;
  dateMax: string;
  totalRecords: number;
  statuses: Record<string, number>;
  currencyAssumption: string;
}
