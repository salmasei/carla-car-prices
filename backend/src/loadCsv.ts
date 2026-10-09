import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse";
import type { SaleRecord } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** CSV timestamps look like `2023-01-01 13.23.19` (dots instead of colons). */
export function parseOrderDate(raw: string): Date {
  const normalized = raw.trim().replace(/^(\d{4}-\d{2}-\d{2}) (\d{2})\.(\d{2})\.(\d{2})$/, "$1T$2:$3:$4");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid order_date: ${raw}`);
  }
  return date;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function loadSales(csvPath = defaultCsvPath()): Promise<SaleRecord[]> {
  const records: SaleRecord[] = [];

  const parser = createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    }),
  );

  for await (const row of parser) {
    records.push({
      orderId: row.order_id,
      orderDate: parseOrderDate(row.order_date),
      orderStatus: row.order_status,
      vehicleId: row.vehicle_id,
      price: Number(row.price),
      make: row.make,
      model: row.model,
      version: row.version,
      color: row.color,
      modelYear: Number(row.model_year),
      mileageKilometers: Number(row.mileage_kilometers),
    });
  }

  return records;
}

export function defaultCsvPath(): string {
  return path.resolve(__dirname, "../../data/car_sales.csv");
}

export function datasetBounds(sales: SaleRecord[]): { dateMin: string; dateMax: string } {
  let min = sales[0]?.orderDate;
  let max = sales[0]?.orderDate;
  for (const sale of sales) {
    if (!min || sale.orderDate < min) min = sale.orderDate;
    if (!max || sale.orderDate > max) max = sale.orderDate;
  }
  if (!min || !max) {
    throw new Error("Sales dataset is empty");
  }
  return { dateMin: toDateKey(min), dateMax: toDateKey(max) };
}
