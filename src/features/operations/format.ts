import type { CurrencyCode, IsoDate, IsoDateTime, MinorUnits } from "./domain";

/**
 * Display helpers.
 *
 * Every formatter pins the locale and the UTC time zone. Dates are rendered on
 * the server during SSR and again in the browser; without a fixed zone the two
 * disagree and React reports a hydration mismatch.
 */

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(value: IsoDate | IsoDateTime | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : DATE_FORMAT.format(parsed);
}

export function formatDateTime(value: IsoDateTime | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : `${DATE_TIME_FORMAT.format(parsed)} UTC`;
}

/**
 * Dates may be undecided, and saying so is more useful than a placeholder.
 * A half-known range shows the end it has rather than inventing the other.
 */
export function formatDateRange(start: IsoDate | null, end: IsoDate | null): string {
  if (start === null && end === null) return "Dates to be confirmed";
  if (start === null) return `Until ${formatDate(end)}`;
  if (end === null) return `From ${formatDate(start)}`;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  hour: "numeric",
  minute: "2-digit",
});

/**
 * A start and end shown as one phrase, collapsing the repeated date when an
 * event begins and ends on the same day.
 */
export function formatDateTimeRange(start: IsoDateTime, end: IsoDateTime): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return "—";

  if (start.slice(0, 10) === end.slice(0, 10)) {
    return `${DATE_FORMAT.format(startDate)}, ${TIME_FORMAT.format(startDate)} – ${TIME_FORMAT.format(endDate)} UTC`;
  }
  return `${formatDateTime(start)} – ${formatDateTime(end)}`;
}

/** Coarse age band, or a dash where a program has none. */
export function formatAgeRange(range: { minAge: number; maxAge: number } | null): string {
  return range === null ? "—" : `Ages ${range.minAge}–${range.maxAge}`;
}

export function formatCurrency(amountMinor: MinorUnits, currency: CurrencyCode = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}

/** Turns a snake_case status or code into a readable label. */
export function formatLabel(value: string): string {
  const spaced = value.replace(/[._]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
