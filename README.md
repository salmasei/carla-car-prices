# Carla Car Prices

Internal web app for exploring historical Carla car sale prices by make and model over a date range.

Prices are shown in SEK.

## Stack

- **backend** — Node.js + TypeScript REST API (Express)
- **frontend** — React + TypeScript (Vite)
- **data/car_sales.csv** — sales dataset (~2.2k rows)

## How to run

Prerequisites: Node.js 20+.

```bash
cd carla-car-prices
npm install
npm run dev
```

Then open:

- UI: http://localhost:5173
- API: http://localhost:4000

Useful endpoints:

- `GET /api/health`
- `GET /api/meta`
- `GET /api/prices?from=2023-01-01&to=2023-12-31&status=COMPLETED`

`status` accepts a comma-separated list, or `all`. Default is `COMPLETED`.

## What the app does

1. Pick a date range (or a period shortcut like Q1 / last 30 days).
2. Optionally search by make/model, or click one of the top brands by sales volume.
3. See KPIs (sales count, models, median, price range), a sortable table, and a detail panel with monthly median prices for the selected model.

## Assumptions

1. **Default to completed sales only**  
   The CSV has three order statuses:
   - `COMPLETED` — 1 554 rows (used for pricing by default)
   - `CANCELLED` — 575 rows
   - `RETURNED` — 77 rows  
   Cancelled and returned orders are excluded from the default view because they are not closed sales. The API can still include them via `status`.

2. **Aggregate by make + model, not version**  
   In the CSV, `make` / `model` are the brand and model name (e.g. Tesla / Model 3).  
   `version` is the more specific trim / configuration string, for example:
   - `Tesla Model 3 Long Range AWD, 440hp, 2021`
   - `Nissan Leaf 40 kWh, 149hp, 2019`
   - `Škoda Enyaq iV 80X, 265hp, 2022`  
   There are many distinct versions, often with few sales each, so the first cut groups by make + model for a clearer market overview. Version is still available in the raw data for a later drill-down.

3. **Date filter uses inclusive calendar days** on `order_date` (`YYYY-MM-DD`), ignoring time-of-day for range matching.

4. **CSV timestamps use dots in the time** (`2023-01-01 13.23.19`) — parsed as hours:minutes:seconds.

5. **Show median next to average** — used-car prices are skewed; median is less sensitive to a few very high or low sales.

## Design tradeoffs

- **Load the CSV into memory once at startup** — simple and fast for ~2k rows. No database. Not meant for multi-GB data or live file updates without a restart.
- **Do pricing math on the server** — median, average, min/max, and monthly medians are computed in the API so the UI is not inventing its own stats for a date range.
- **Filter by brand/search in the browser after load** — typing and brand filters feel instant. The downside: when those filters are on, the overall median is an approximation based on each model’s median, not a fresh median over every matching raw sale. A follow-up would pass those filters to the API.
- **Show only the top 10 brands as filter buttons** — keeps the filter row readable. Other brands are still reachable via search.
- **REST + JSON** — easy to inspect in the browser; enough for a read-only internal tool.
- **No auth** — treated as a local / internal demo tool.

## What I'd do differently or build next

With more time:

- Compare two periods side by side
- Store data in SQLite/Postgres with indexes on date, make, and model
- Optional drill-down from model → version
- Auth if this were shared beyond localhost

## Project layout

```text
carla-car-prices/
  data/car_sales.csv
  backend/src/                 # Express API
  frontend/src/                # React UI
  README.md
```
