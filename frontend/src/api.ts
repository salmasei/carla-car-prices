import type { MetaResponse, PricesResponse } from "./types";

/** Fetches dataset metadata (date bounds, record count, status breakdown). */
export async function fetchMeta(): Promise<MetaResponse> {
  const response = await fetch("/api/meta");
  if (!response.ok) {
    throw new Error("Could not load dataset metadata");
  }
  return response.json();
}

/** Fetches aggregated prices for completed sales between `from` and `to`. */
export async function fetchPrices(from: string, to: string): Promise<PricesResponse> {
  const params = new URLSearchParams({ from, to, status: "COMPLETED" });
  const response = await fetch(`/api/prices?${params}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Could not load prices");
  }
  return response.json();
}
