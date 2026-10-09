import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { aggregatePrices } from "./aggregate.js";
import { datasetBounds, loadSales } from "./loadCsv.js";
import type { MetaResponse, SaleRecord } from "./types.js";

const PORT = Number(process.env.PORT ?? 4000);
const DEFAULT_STATUSES = ["COMPLETED"];
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = process.env.STATIC_DIR
  ? path.resolve(process.env.STATIC_DIR)
  : path.resolve(__dirname, "../../frontend/dist");

let sales: SaleRecord[] = [];

function parseStatuses(raw: unknown): string[] {
  if (typeof raw !== "string" || raw.trim() === "") return DEFAULT_STATUSES;
  if (raw.trim().toLowerCase() === "all") return [];
  return raw
    .split(",")
    .map((status) => status.trim())
    .filter(Boolean);
}

async function main() {
  sales = await loadSales();
  const bounds = datasetBounds(sales);

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, recordsLoaded: sales.length });
  });

  app.get("/api/meta", (_req, res) => {
    const statuses: Record<string, number> = {};
    for (const sale of sales) {
      statuses[sale.orderStatus] = (statuses[sale.orderStatus] ?? 0) + 1;
    }

    const body: MetaResponse = {
      dateMin: bounds.dateMin,
      dateMax: bounds.dateMax,
      totalRecords: sales.length,
      statuses,
      currencyAssumption: "SEK",
    };
    res.json(body);
  });

  app.get("/api/prices", (req, res) => {
    const from = typeof req.query.from === "string" ? req.query.from : bounds.dateMin;
    const to = typeof req.query.to === "string" ? req.query.to : bounds.dateMax;
    const statuses = parseStatuses(req.query.status);

    try {
      const result = aggregatePrices(sales, from, to, statuses);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to aggregate prices";
      res.status(400).json({ error: message });
    }
  });

  app.use(express.static(staticDir));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });

  app.listen(PORT, () => {
    console.log(`Carla price API listening on http://localhost:${PORT}`);
    console.log(`Loaded ${sales.length} sales (${bounds.dateMin} → ${bounds.dateMax})`);
    console.log(`Serving UI from ${staticDir}`);
  });
}

main().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
