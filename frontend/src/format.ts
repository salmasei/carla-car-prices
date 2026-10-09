const sek = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("sv-SE");

export function formatSek(value: number): string {
  return sek.format(value);
}

export function formatNumber(value: number): string {
  return number.format(value);
}

export function formatKm(value: number): string {
  return `${number.format(value)} km`;
}

/** Compact thousands, e.g. 455k */
export function formatSekK(value: number): string {
  return `${number.format(Math.round(value / 1000))}k`;
}

export function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
