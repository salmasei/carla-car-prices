/** Dataset bounds and status counts from `/api/meta`. */
export interface MetaResponse {
  dateMin: string;
  dateMax: string;
  totalRecords: number;
  statuses: Record<string, number>;
  currencyAssumption: string;
}

/** Price and mileage stats for one make/model in the selected period. */
export interface ModelPriceAggregate {
  make: string;
  model: string;
  saleCount: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  medianPrice: number;
  avgMileageKilometers: number;
  monthlyMedians: number[];
}

/** How many sales a make has in the current price response. */
export interface MakeCount {
  make: string;
  saleCount: number;
}

/** Overall totals for the filtered sales set from `/api/prices`. */
export interface PriceSummary {
  from: string;
  to: string;
  statusesIncluded: string[];
  totalSales: number;
  distinctModels: number;
  overallAvgPrice: number;
  overallMedianPrice: number;
  overallMinPrice: number;
  overallMaxPrice: number;
}

/** Full `/api/prices` response used by the UI. */
export interface PricesResponse {
  summary: PriceSummary;
  makes: MakeCount[];
  models: ModelPriceAggregate[];
}

/** Columns the models table can sort by. */
export type SortKey =
  | "name"
  | "saleCount"
  | "medianPrice"
  | "avgPrice"
  | "minPrice"
  | "avgMileageKilometers";
