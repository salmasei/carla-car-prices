import { toDateKey } from "./loadCsv.js";
import type { MakeCount, ModelPriceAggregate, PricesResponse, SaleRecord } from "./types.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
  }
  return sorted[mid]!;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function assertDate(value: string, label: string): void {
  if (!DATE_RE.test(value)) {
    throw new Error(`Invalid ${label}: ${value}. Expected YYYY-MM-DD.`);
  }
}

function monthlyMedians(group: SaleRecord[]): number[] {
  const buckets: number[][] = Array.from({ length: 12 }, () => []);
  for (const sale of group) {
    buckets[sale.orderDate.getMonth()]!.push(sale.price);
  }
  return buckets.map((prices) => {
    if (prices.length === 0) return 0;
    return median([...prices].sort((a, b) => a - b));
  });
}

export function aggregatePrices(
  sales: SaleRecord[],
  from: string,
  to: string,
  statuses: string[],
): PricesResponse {
  assertDate(from, "from");
  assertDate(to, "to");
  if (from > to) {
    throw new Error("`from` must be on or before `to`.");
  }

  const statusSet = new Set(statuses.map((status) => status.toUpperCase()));

  const filtered = sales.filter((sale) => {
    const day = toDateKey(sale.orderDate);
    if (day < from || day > to) return false;
    if (statusSet.size > 0 && !statusSet.has(String(sale.orderStatus).toUpperCase())) return false;
    return Number.isFinite(sale.price);
  });

  const makeCounts = new Map<string, number>();
  for (const sale of filtered) {
    makeCounts.set(sale.make, (makeCounts.get(sale.make) ?? 0) + 1);
  }
  const makes: MakeCount[] = [...makeCounts.entries()]
    .map(([make, saleCount]) => ({ make, saleCount }))
    .sort((a, b) => b.saleCount - a.saleCount || a.make.localeCompare(b.make));

  const byModel = new Map<string, SaleRecord[]>();
  for (const sale of filtered) {
    const key = `${sale.make}||${sale.model}`;
    const bucket = byModel.get(key);
    if (bucket) bucket.push(sale);
    else byModel.set(key, [sale]);
  }

  const models: ModelPriceAggregate[] = [];
  for (const group of byModel.values()) {
    const prices = group.map((sale) => sale.price).sort((a, b) => a - b);
    const mileages = group.map((sale) => sale.mileageKilometers);

    models.push({
      make: group[0]!.make,
      model: group[0]!.model,
      saleCount: group.length,
      avgPrice: average(prices),
      minPrice: prices[0]!,
      maxPrice: prices[prices.length - 1]!,
      medianPrice: median(prices),
      avgMileageKilometers: average(mileages),
      monthlyMedians: monthlyMedians(group),
    });
  }

  models.sort(
    (a, b) => b.saleCount - a.saleCount || a.make.localeCompare(b.make) || a.model.localeCompare(b.model),
  );

  const allPrices = filtered.map((sale) => sale.price).sort((a, b) => a - b);

  return {
    summary: {
      from,
      to,
      statusesIncluded: statuses,
      totalSales: filtered.length,
      distinctModels: models.length,
      overallAvgPrice: average(allPrices),
      overallMedianPrice: median(allPrices),
      overallMinPrice: allPrices.length ? allPrices[0]! : 0,
      overallMaxPrice: allPrices.length ? allPrices[allPrices.length - 1]! : 0,
    },
    makes,
    models,
  };
}
