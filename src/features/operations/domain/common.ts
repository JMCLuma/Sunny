/**
 * Primitives shared by every Operations domain type.
 *
 * Phase 1 is mock-data only. These aliases exist so that the shape of an ID or
 * a timestamp is stated once and can be tightened later (branded types, or
 * Supabase-generated row types) without touching every module.
 */

/** Stable opaque identifier. Mock data uses readable slugs (e.g. `prog_mosaic`). */
export type Id = string;

/** Full ISO-8601 timestamp, e.g. `2026-03-04T15:00:00.000Z`. */
export type IsoDateTime = string;

/** ISO-8601 calendar date with no time component, e.g. `2026-03-04`. */
export type IsoDate = string;

/** Currency amounts are stored in minor units (cents) to avoid float drift. */
export type MinorUnits = number;

export type CurrencyCode = "USD";

/** Lifecycle shared by most records that can be retired without being deleted. */
export type RecordStatus = "draft" | "active" | "archived";

/**
 * Where a record sits in a review chain. Individual modules narrow this where
 * they need fewer states; keeping one vocabulary keeps queues comparable.
 */
export type ApprovalState = "not_submitted" | "pending" | "approved" | "rejected" | "withdrawn";

export type Priority = "low" | "normal" | "high" | "urgent";

/** Non-confidential, module-defined extras. Never use this for sensitive data. */
export type Metadata = Readonly<Record<string, string | number | boolean>>;
