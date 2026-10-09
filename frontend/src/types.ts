export interface MetaResponse {
  dateMin: string;
  dateMax: string;
  totalRecords: number;
  statuses: Record<string, number>;
  currencyAssumption: string;
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
  monthlyMedians: number[];
}

export interface MakeCount {
  make: string;
  saleCount: number;
}

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

export interface PricesResponse {
  summary: PriceSummary;
  makes: MakeCount[];
  models: ModelPriceAggregate[];
}

export type SortKey =
  | "name"
  | "saleCount"
  | "medianPrice"
  | "avgPrice"
  | "minPrice"
  | "avgMileageKilometers";
