import { isValidCityKey } from "./cityValidator";
import type { FieldError } from "./userValidation";

// Разумные границы цены за место (UZS). Раньше цена не проверялась: принимались 1 UZS
// и 10 000 000 000 000 UZS, а отрицательная роняла создание поездки с непонятной ошибкой.
export const PRICE_MIN = 1_000;
export const PRICE_MAX = 10_000_000;
export const SEATS_MIN = 1;
export const SEATS_MAX = 8;
export const DESCRIPTION_MAX = 500;
export const ADDRESS_MAX = 200;

/** Поля, которые водитель может менять в своей поездке (остальное — статус, driverId и т.п. — нельзя) */
export const EDITABLE_TRIP_FIELDS = [
  "from",
  "to",
  "departureAt",
  "price",
  "availableSeats",
  "description",
  "maxTwoBackSeats",
] as const;

/**
 * Проверка полей поездки. partial=true — для PATCH: проверяются только переданные поля.
 */
export const validateTripInput = (body: Record<string, any>, { partial = false } = {}): FieldError[] => {
  const errors: FieldError[] = [];
  const present = (k: string) => body[k] !== undefined && body[k] !== null && body[k] !== "";
  const check = (k: string) => (partial ? present(k) : true);

  for (const f of ["from", "to", "departureAt", "price", "availableSeats"]) {
    if (!partial && !present(f)) errors.push({ field: f, code: "FIELD_REQUIRED" });
  }
  const ok = (f: string) => !errors.some((e) => e.field === f);

  for (const f of ["from", "to"] as const) {
    if (!check(f) || !ok(f)) continue;
    const place = body[f];
    if (typeof place !== "object" || !isValidCityKey(place?.cityKey)) {
      errors.push({ field: f, code: "INVALID_CITY_KEY" });
    } else if (place.address !== undefined && String(place.address).length > ADDRESS_MAX) {
      errors.push({ field: f, code: "TEXT_TOO_LONG", max: ADDRESS_MAX });
    }
  }
  if (ok("from") && ok("to") && body.from?.cityKey && body.from?.cityKey === body.to?.cityKey) {
    errors.push({ field: "to", code: "SAME_CITY" });
  }

  if (check("departureAt") && ok("departureAt")) {
    const d = new Date(body.departureAt);
    if (isNaN(d.getTime())) errors.push({ field: "departureAt", code: "INVALID_DATE_FORMAT" });
    else if (d <= new Date()) errors.push({ field: "departureAt", code: "TRIP_DATETIME_FUTURE_REQUIRED" });
  }

  if (check("price") && ok("price")) {
    const price = Number(body.price);
    if (!Number.isFinite(price)) errors.push({ field: "price", code: "PRICE_INVALID" });
    else if (price < PRICE_MIN || price > PRICE_MAX)
      errors.push({ field: "price", code: "PRICE_OUT_OF_RANGE", min: PRICE_MIN, max: PRICE_MAX });
  }

  if (check("availableSeats") && ok("availableSeats")) {
    const seats = Number(body.availableSeats);
    if (!Number.isInteger(seats) || seats < SEATS_MIN || seats > SEATS_MAX)
      errors.push({ field: "availableSeats", code: "SEATS_OUT_OF_RANGE", min: SEATS_MIN, max: SEATS_MAX });
  }

  if (present("description") && String(body.description).length > DESCRIPTION_MAX)
    errors.push({ field: "description", code: "TEXT_TOO_LONG", max: DESCRIPTION_MAX });

  return errors;
};
