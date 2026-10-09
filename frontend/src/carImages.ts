function slugify(make: string, model: string): string {
  return `${make} ${model}`
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Local studio shots from Carla listings (cdn.spinio.fi). */
const STUDIO_PHOTOS = new Set([
  "audi-q4",
  "bmw-545e",
  "bmw-550e",
  "bmw-i3",
  "bmw-x3",
  "hyundai-kona",
  "kia-ceed",
  "kia-e-soul",
  "kia-ev6",
  "kia-niro",
  "kia-optima",
  "kia-sorento",
  "kia-sportage",
  "kia-xceed",
  "mazda-mx-30",
  "mercedes-benz-gle",
  "mg-ehs",
  "mg-marvel-r",
  "mg-zs",
  "nissan-leaf",
  "polestar-2",
  "porsche-taycan",
  "renault-megane",
  "renault-scenic-e-tech",
  "renault-zoe",
  "seat-tarraco",
  "skoda-enyaq",
  "tesla-model-3",
  "tesla-model-s",
  "tesla-model-y",
  "volkswagen-golf",
  "volkswagen-id-4",
  "volvo-s60",
  "volvo-v60",
  "volvo-v90",
  "volvo-xc40",
  "volvo-xc60",
  "volvo-xc90",
]);

const ALIASES: Record<string, string> = {
  "skoda-enyaq-iv": "skoda-enyaq",
  "mg-zs-suv": "mg-zs",
  "kia-e-niro": "kia-niro",
  "volkswagen-id4": "volkswagen-id-4",
  "volkswagen-id-4": "volkswagen-id-4",
};

export function carImageUrl(make: string, model: string): string {
  const slug = slugify(make, model);
  const file = ALIASES[slug] ?? slug;
  if (STUDIO_PHOTOS.has(file)) {
    return `/cars/${file}.jpg`;
  }
  return "/cars/fallback.jpg";
}
