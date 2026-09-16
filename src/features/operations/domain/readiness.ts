import type { Id, IsoDateTime } from "./common";

/**
 * Operational readiness for a program instance.
 *
 * A planning aid, not a system of record. Each signal says how one area is
 * tracking and nothing more: no contract terms, no compliance results, no
 * money, no people. Finance, Vendors, Compliance and People remain the
 * authoritative sources, and this summary must never be built by copying their
 * detail into the Programs module.
 */
export type ReadinessArea =
  "schedule" | "venue" | "applications" | "staffing" | "training" | "compliance" | "travel";

export type ReadinessStatus =
  "not_started" | "needs_attention" | "in_progress" | "ready" | "not_applicable";

export interface ReadinessSignal {
  readonly id: Id;
  readonly programInstanceId: Id;
  readonly area: ReadinessArea;
  readonly status: ReadinessStatus;
  /** One short, non-confidential line of context. Never a name or a figure. */
  readonly note: string | null;
  readonly updatedAt: IsoDateTime;
}

/** Presentation order — areas read in roughly the order they get worked. */
export const READINESS_AREAS: readonly ReadinessArea[] = [
  "schedule",
  "venue",
  "applications",
  "staffing",
  "training",
  "compliance",
  "travel",
];
