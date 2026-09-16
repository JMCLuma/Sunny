/**
 * Operations domain model.
 *
 * Pure types only — no data, no I/O, no React. Everything the Operations
 * modules exchange is described here so that the mock repository today and a
 * Supabase-backed repository later satisfy the same contract.
 */
export type * from "./common";
export type * from "./organization";
export type * from "./region";
export type * from "./program";
export type * from "./readiness";
export type * from "./people";
export type * from "./compliance";
export type * from "./finance";
export type * from "./documents";
export type * from "./risk";
export type * from "./tasks";
export type * from "./audit";
export type * from "./integrations";

/** The one value the domain exports: a fixed presentation order for readiness. */
export { READINESS_AREAS } from "./readiness";
