/** Known order statuses in the sales dataset (plus any other string from the CSV). */
export type OrderStatus = "COMPLETED" | "CANCELLED" | "RETURNED" | string;

/** One car sale row loaded from the CSV. */
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

/** Price and mileage stats for a single make/model within a date range. */
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

/** High-level totals for the filtered sales set returned by `/api/prices`. */
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

/** How many sales a make has in the filtered set. */
export interface MakeCount {
  make: string;
  saleCount: number;
}

/** Full response body for the prices aggregation endpoint. */
export interface PricesResponse {
  summary: PriceSummary;
  makes: MakeCount[];
  models: ModelPriceAggregate[];
}

/** Dataset bounds and status counts returned by `/api/meta`. */
export interface MetaResponse {
  dateMin: string;
  dateMax: string;
  totalRecords: number;
  statuses: Record<string, number>;
  currencyAssumption: string;
}
