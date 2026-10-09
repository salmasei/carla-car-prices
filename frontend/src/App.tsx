import { useEffect, useMemo, useState } from "react";
import { fetchMeta, fetchPrices } from "./api";
import {
  addDays,
  formatDisplayDate,
  formatKm,
  formatNumber,
  formatSek,
  formatSekK,
} from "./format";
import type { MetaResponse, ModelPriceAggregate, PricesResponse, SortKey } from "./types";

type SortDir = 1 | -1;

const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const HEADERS: { label: string; key: SortKey; align: "left" | "right" }[] = [
  { label: "Model", key: "name", align: "left" },
  { label: "Sales", key: "saleCount", align: "right" },
  { label: "Median", key: "medianPrice", align: "right" },
  { label: "Average", key: "avgPrice", align: "right" },
  { label: "Price range", key: "minPrice", align: "left" },
  { label: "Avg mileage", key: "avgMileageKilometers", align: "right" },
];

function modelName(row: ModelPriceAggregate): string {
  return `${row.make} ${row.model}`;
}

function sortValue(row: ModelPriceAggregate, key: SortKey): string | number {
  if (key === "name") return modelName(row);
  return row[key];
}

export default function App() {
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<PricesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("saleCount");
  const [sortDir, setSortDir] = useState<SortDir>(-1);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const nextMeta = await fetchMeta();
        if (cancelled) return;
        setMeta(nextMeta);
        setFrom(nextMeta.dateMin);
        setTo(nextMeta.dateMax);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!from || !to) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const prices = await fetchPrices(from, to);
        if (cancelled) return;
        setData(prices);
        setSelectedModel(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const presets = useMemo(() => {
    if (!meta) return [];
    const year = meta.dateMin.slice(0, 4);
    const last30From = addDays(meta.dateMax, -29);
    return [
      { label: `Full year ${year}`, from: `${year}-01-01`, to: `${year}-12-31` },
      { label: "Q1", from: `${year}-01-01`, to: `${year}-03-31` },
      { label: "Q2", from: `${year}-04-01`, to: `${year}-06-30` },
      { label: "Q3", from: `${year}-07-01`, to: `${year}-09-30` },
      { label: "Q4", from: `${year}-10-01`, to: `${year}-12-31` },
      { label: "Last 30 days", from: last30From < meta.dateMin ? meta.dateMin : last30From, to: meta.dateMax },
    ];
  }, [meta]);

  const topMakes = useMemo(() => data?.makes.slice(0, 10) ?? [], [data]);

  useEffect(() => {
    const allowed = new Set(topMakes.map((item) => item.make));
    setSelectedMakes((current) => {
      const next = current.filter((make) => allowed.has(make));
      return next.length === current.length ? current : next;
    });
  }, [topMakes]);

  const filteredModels = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.models.filter((row) => {
      if (selectedMakes.length && !selectedMakes.includes(row.make)) return false;
      if (q && !modelName(row).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, query, selectedMakes]);

  const sortedModels = useMemo(() => {
    const rows = [...filteredModels];
    rows.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * sortDir;
      return (Number(av) - Number(bv)) * sortDir;
    });
    return rows;
  }, [filteredModels, sortDir, sortKey]);

  const hasFilters = Boolean(query.trim() || selectedMakes.length);

  const viewStats = useMemo(() => {
    if (!data) {
      return { totalSales: 0, distinctModels: 0, median: 0, avg: 0, min: 0, max: 0 };
    }

    if (!hasFilters) {
      return {
        totalSales: data.summary.totalSales,
        distinctModels: data.summary.distinctModels,
        median: data.summary.overallMedianPrice,
        avg: data.summary.overallAvgPrice,
        min: data.summary.overallMinPrice,
        max: data.summary.overallMaxPrice,
      };
    }

    if (filteredModels.length === 0) {
      return { totalSales: 0, distinctModels: 0, median: 0, avg: 0, min: 0, max: 0 };
    }

    const totalSales = filteredModels.reduce((sum, row) => sum + row.saleCount, 0);
    const expanded: number[] = [];
    for (const row of filteredModels) {
      for (let i = 0; i < row.saleCount; i++) expanded.push(row.medianPrice);
    }
    expanded.sort((a, b) => a - b);
    const mid = Math.floor(expanded.length / 2);
    const median =
      expanded.length % 2 === 0
        ? Math.round((expanded[mid - 1]! + expanded[mid]!) / 2)
        : expanded[mid]!;

    return {
      totalSales,
      distinctModels: filteredModels.length,
      median,
      avg: Math.round(
        filteredModels.reduce((sum, row) => sum + row.avgPrice * row.saleCount, 0) / totalSales,
      ),
      min: Math.min(...filteredModels.map((row) => row.minPrice)),
      max: Math.max(...filteredModels.map((row) => row.maxPrice)),
    };
  }, [data, filteredModels, hasFilters]);

  const priceSpan = Math.max(1, viewStats.max - viewStats.min);

  const detailModel = useMemo(() => {
    if (!sortedModels.length) return null;
    if (selectedModel) {
      return sortedModels.find((row) => modelName(row) === selectedModel) ?? sortedModels[0]!;
    }
    return [...sortedModels].sort((a, b) => b.saleCount - a.saleCount)[0]!;
  }, [selectedModel, sortedModels]);

  const detailIsSelected = Boolean(selectedModel && detailModel && modelName(detailModel) === selectedModel);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === 1 ? -1 : 1));
      return;
    }
    setSortKey(key);
    setSortDir(key === "name" ? 1 : -1);
  }

  function toggleMake(make: string) {
    setSelectedMakes((current) =>
      current.includes(make) ? current.filter((item) => item !== make) : [...current, make],
    );
  }

  function clearFilters() {
    setQuery("");
    setSelectedMakes([]);
    setSelectedModel(null);
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-brand">
          <img className="topbar-logo" src="/carla-logo.svg" alt="Carla" width={123} height={28} />
          <span className="topbar-divider" />
          <span className="topbar-title">Price history</span>
        </div>
        <span className="topbar-meta">Internal · prices in SEK</span>
      </header>

      <main className="page">
        <div className="intro">
          <h1>Historical sale prices</h1>
          <p>Pick a period, then search or filter to compare completed sales by model.</p>
        </div>

        <section className="card filters-card">
          <div className="date-search-grid">
            <label className="field">
              From
              <input
                type="date"
                value={from}
                min={meta?.dateMin}
                max={meta?.dateMax}
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>
            <label className="field">
              To
              <input
                type="date"
                value={to}
                min={meta?.dateMin}
                max={meta?.dateMax}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
            <label className="field">
              Search make or model
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="e.g. Model 3, Enyaq, Polestar"
              />
            </label>
          </div>

          <div className="chip-row" aria-label="Period shortcuts">
            <span className="chip-row-label">Period</span>
            {presets.map((preset) => {
              const on = from === preset.from && to === preset.to;
              return (
                <button
                  key={preset.label}
                  type="button"
                  className={`pill${on ? " is-on" : ""}`}
                  onClick={() => {
                    setFrom(preset.from);
                    setTo(preset.to);
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {data && (
            <div className="chip-row" aria-label="Filter by make">
              <span className="chip-row-label">Make</span>
              {topMakes.map((item) => {
                const on = selectedMakes.includes(item.make);
                return (
                  <button
                    key={item.make}
                    type="button"
                    className={`make-chip${on ? " is-on" : ""}`}
                    aria-pressed={on}
                    onClick={() => toggleMake(item.make)}
                  >
                    <span>{item.make}</span>
                    <span className="make-count">{formatNumber(item.saleCount)}</span>
                  </button>
                );
              })}
              {hasFilters && (
                <button type="button" className="link-clear" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>

        {error && <p className="error-line">{error}</p>}
        {loading && !data && <p className="status-soft">Loading prices…</p>}

        {data && (
          <>
            <section className="kpi-row">
              <div className="kpi">
                <span className="kpi-label">Completed sales</span>
                <span className="kpi-value">{formatNumber(viewStats.totalSales)}</span>
                <span className="kpi-sub">
                  of {formatNumber(meta?.totalRecords ?? 0)} orders in dataset
                </span>
              </div>
              <div className="kpi">
                <span className="kpi-label">Models</span>
                <span className="kpi-value">{formatNumber(viewStats.distinctModels)}</span>
                <span className="kpi-sub">
                  {selectedMakes.length || data.makes.length} makes
                </span>
              </div>
              <div className="kpi">
                <span className="kpi-label">Median price</span>
                <span className="kpi-value">
                  {viewStats.totalSales ? formatSek(viewStats.median) : "–"}
                </span>
                <span className="kpi-sub">
                  {viewStats.totalSales ? `Average ${formatSek(viewStats.avg)}` : ""}
                </span>
              </div>
              <div className="kpi">
                <span className="kpi-label">Price range</span>
                <span className="kpi-value">
                  {viewStats.totalSales
                    ? `${formatSekK(viewStats.min)} – ${formatSekK(viewStats.max)}`
                    : "–"}
                </span>
                <span className="kpi-sub">Lowest to highest sale</span>
              </div>
            </section>

            <section className="results-grid">
              <div className="card table-card">
                <div className="table-head">
                  <h2>Price breakdown</h2>
                  <span className="table-note">
                    {formatNumber(sortedModels.length)} models · {formatDisplayDate(from)} –{" "}
                    {formatDisplayDate(to)} · click a row for details
                  </span>
                </div>

                {sortedModels.length === 0 ? (
                  <div className="empty-state">
                    <strong>No completed sales match</strong>
                    <span>Try a wider period or clear the search.</span>
                    <button type="button" className="btn-primary" onClick={clearFilters}>
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          {HEADERS.map((header) => (
                            <th key={header.key} className={header.align}>
                              <button type="button" onClick={() => toggleSort(header.key)}>
                                {header.label}
                                {sortKey === header.key ? (sortDir < 0 ? " ↓" : " ↑") : ""}
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedModels.map((row) => {
                          const name = modelName(row);
                          const active = detailModel ? modelName(detailModel) === name : false;
                          const left = ((row.minPrice - viewStats.min) / priceSpan) * 100;
                          const width = ((row.maxPrice - row.minPrice) / priceSpan) * 100;
                          const medLeft = ((row.medianPrice - viewStats.min) / priceSpan) * 100;
                          return (
                            <tr
                              key={name}
                              className={active ? "is-active" : undefined}
                              onClick={() => setSelectedModel(name)}
                            >
                              <td className="model-cell">
                                <strong>{row.model}</strong>
                                <span className="make">{row.make}</span>
                              </td>
                              <td className="right num">{formatNumber(row.saleCount)}</td>
                              <td className="right num">{formatSek(row.medianPrice)}</td>
                              <td className="right num">{formatSek(row.avgPrice)}</td>
                              <td>
                                <div className="range-cell">
                                  <span className="range-ends">
                                    {formatSekK(row.minPrice)} – {formatSekK(row.maxPrice)}
                                  </span>
                                  <div className="range-track">
                                    <div
                                      className="range-bar"
                                      style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%` }}
                                    />
                                    <div className="range-median" style={{ left: `${medLeft}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="right num">{formatKm(row.avgMileageKilometers)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <aside className="card detail-card">
                {detailModel ? (
                  <>
                    <div className="detail-head">
                      <span className="detail-kicker">
                        {detailIsSelected ? "Selected model" : "Top seller in range"}
                      </span>
                      <h2>
                        {detailModel.make} {detailModel.model}
                      </h2>
                    </div>
                    <div className="detail-facts">
                      <div>
                        <span>Sales</span>
                        <strong>{formatNumber(detailModel.saleCount)}</strong>
                      </div>
                      <div>
                        <span>Median</span>
                        <strong>{formatSek(detailModel.medianPrice)}</strong>
                      </div>
                      <div>
                        <span>Lowest</span>
                        <strong>{formatSek(detailModel.minPrice)}</strong>
                      </div>
                      <div>
                        <span>Highest</span>
                        <strong>{formatSek(detailModel.maxPrice)}</strong>
                      </div>
                    </div>
                    <div className="detail-months">
                      <span className="detail-months-title">Median price by month</span>
                      <MonthChart months={detailModel.monthlyMedians} />
                      <span className="detail-months-hint">
                        Hover a bar for the value. Grey months have no sales in range.
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="status-soft">Select a period with completed sales.</p>
                )}
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function MonthChart({ months }: { months: number[] }) {
  const present = months.filter((value) => value > 0);
  const max = Math.max(...present, 1);
  const min = present.length ? Math.min(...present) * 0.9 : 0;

  return (
    <>
      <div className="month-bars" aria-label="Median price by month">
        {months.map((value, index) => {
          const height =
            value > 0 ? `${Math.max(8, ((value - min) / (max - min || 1)) * 100)}%` : "2px";
          return (
            <div
              key={MONTH_LABELS[index]}
              className="month-col"
              title={value ? formatSek(value) : "No sales"}
            >
              <div
                className={`month-bar${value ? "" : " is-empty"}`}
                style={{ height }}
              />
            </div>
          );
        })}
      </div>
      <div className="month-labels">
        {MONTH_LABELS.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
    </>
  );
}
