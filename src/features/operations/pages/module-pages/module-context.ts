import type { OperationsModuleId } from "../../navigation";

/**
 * What each not-yet-built module is actually for.
 *
 * The bare placeholder says "not configured yet", which is honest but leaves a
 * presenter with nothing to say and a reader with no idea whether the module
 * is missing or merely elsewhere. Most of these are neither new nor unbuilt:
 * Luma 1.0 runs finance, health review and onsite medical in production today
 * — 74 pages, 92 tables, 77 edge functions — and the merge carries them
 * forward unchanged.
 *
 * Re-drawing them here would be invention, not design, and would invite a
 * decision to be made against a screen nobody had thought through. So each
 * module states where it lives now, what changes in 2.0, and which part of the
 * BRD governs it. That is genuinely useful in the room, and it is true.
 */

export type ModuleOrigin =
  /** Shipped in Luma 1.0 and carried forward unchanged. */
  | "luma_1"
  /** Shipped in Luma 1.0, with additions in 2.0. */
  | "luma_1_extended"
  /** New in Luma 2.0, absorbed from IUSA 2.0 or the 2026 brainstorm. */
  | "new";

export interface ModuleContext {
  readonly origin: ModuleOrigin;
  /** Where this runs today, for a module that already exists. */
  readonly todayIn: string | null;
  /** What the merge changes. Empty when nothing changes. */
  readonly changes: readonly string[];
  /** The screens this module would hold, named honestly rather than drawn. */
  readonly screens: readonly string[];
  readonly brdSection: string;
}

export const ORIGIN_LABELS: Readonly<Record<ModuleOrigin, string>> = {
  luma_1: "Live in Luma 1.0",
  luma_1_extended: "Live in Luma 1.0, extended",
  new: "New in Luma 2.0",
};

export const MODULE_CONTEXT: Readonly<Partial<Record<OperationsModuleId, ModuleContext>>> = {
  finance: {
    origin: "luma_1_extended",
    todayIn: "Luma 1.0 — seven finance sub-domains, in production",
    changes: [
      "Custom payment amounts, mass fee application and bulk subsidy changes by upload, as extensions of the existing fee-precedence engine rather than a parallel one",
      "Reimbursement payors can enter their own financial details, visible only to senior admins",
      "A comment thread so reviewers can query a submission instead of rejecting it",
      "Consolidating the two refund paths onto the governed dual-approval one",
    ],
    screens: [
      "Payments dashboard",
      "Refund requests and approvals",
      "Invoice programmes",
      "Donations",
      "Reimbursements, batches and exports",
      "JMC card",
      "Balancing and closeout sign-off",
    ],
    brdSection: "4.8–4.14",
  },
  compliance: {
    origin: "new",
    todayIn: null,
    changes: [
      "Sterling background checks triggered for selected applicants",
      "Completion status visible without exposing the contents of a check",
      "A trainings tracker for youth protection, first aid and similar",
    ],
    screens: ["Requirement readiness", "Background-check status", "Trainings tracker"],
    brdSection: "4.15",
  },
  vendors: {
    origin: "new",
    todayIn: null,
    changes: ["Suppliers, agreements and renewal dates, currently tracked outside the platform"],
    screens: ["Vendor directory", "Contracts and renewals"],
    brdSection: "—",
  },
  risk: {
    origin: "new",
    todayIn: null,
    changes: [
      "Incident records carry a reference and a status only; the narrative stays with the people authorised to read it",
    ],
    screens: ["Incident log", "Follow-up and review"],
    brdSection: "—",
  },
  documents: {
    origin: "luma_1",
    todayIn: "Luma 1.0 — the document composer, with PDF export",
    changes: [],
    screens: ["Document composer", "Policies and templates", "Review dates and owners"],
    brdSection: "4.18",
  },
  insights: {
    origin: "luma_1_extended",
    todayIn: "Luma 1.0 — survey insights and reporting",
    changes: [
      "Applicant and selection reporting by region, demographic and status",
      "Prioritization score export including the rubric version used",
    ],
    screens: ["Surveys", "Reporting", "Exports"],
    brdSection: "7",
  },
  marketing: {
    origin: "luma_1_extended",
    todayIn: "Luma 1.0 — email templates, broadcasts, SMS hub and translation",
    changes: [
      "Notifications tied to checklist completion, customisable per camp",
      "Automatic re-submission prompts when a form's questions change mid-collection",
      "A directory for looking up an individual's full camp journey, including applications that were not accepted",
    ],
    screens: [
      "Email templates and analytics",
      "Broadcasts and reminders",
      "SMS hub",
      "Translation",
    ],
    brdSection: "4.17",
  },
  admin: {
    origin: "luma_1_extended",
    todayIn: "Luma 1.0 — users, permissions, camps administration and audit",
    changes: [
      "Local / National / JMC tiering, replacing today's flatter role list",
      "The applications and prioritization permission flags",
      "Duplicate-account detection and a merge review queue",
    ],
    screens: [
      "Users and invitations",
      "Permissions manager",
      "Camps administration",
      "Audit and activity",
    ],
    brdSection: "4.16, 3.2",
  },
};
