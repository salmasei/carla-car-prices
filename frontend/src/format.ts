const sek = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("sv-SE");

/** Formats a number as Swedish kronor (e.g. `455 000 kr`). */
export function formatSek(value: number): string {
  return sek.format(value);
}

/** Formats a number with Swedish locale grouping. */
export function formatNumber(value: number): string {
  return number.format(value);
}

/** Formats a mileage value with a `km` suffix. */
export function formatKm(value: number): string {
  return `${number.format(value)} km`;
}

/** Compact thousands for price ranges, e.g. `455k`. */
export function formatSekK(value: number): string {
  return `${number.format(Math.round(value / 1000))}k`;
}

/** Converts `YYYY-MM-DD` to a display date like `01.03.2023`. */
export function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/** Adds `days` to an ISO date string and returns the new `YYYY-MM-DD`. */
export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
