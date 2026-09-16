import type { Id, IsoDateTime, Metadata } from "./common";

/**
 * A configured link to an external system.
 *
 * Phase 1 connects nothing: this type records which integrations are intended
 * and what state they are in, so the Operations overview can show readiness.
 * Credentials, tokens and endpoint URLs are intentionally not modelled here —
 * they belong in secret storage, never in an application record.
 */
export interface IntegrationConnection {
  readonly id: Id;
  readonly name: string;
  readonly category: IntegrationCategory;
  readonly status: IntegrationStatus;
  /** What the connection is for, in one sentence. */
  readonly purpose: string;
  readonly organizationId: Id;
  readonly lastCheckedAt: IsoDateTime | null;
  readonly metadata?: Metadata;
}

export type IntegrationCategory =
  "authentication" | "database" | "payments" | "email" | "storage" | "analytics" | "calendar";

export type IntegrationStatus = "not_configured" | "planned" | "connected" | "degraded" | "error";
