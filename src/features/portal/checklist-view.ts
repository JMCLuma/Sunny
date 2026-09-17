import type { ChecklistView } from "@/features/operations/data";
import type {
  ChecklistEntry,
  ChecklistItemStatus,
  ChecklistTarget,
} from "@/features/operations/domain";
import { formatDate } from "@/features/operations/format";

/**
 * Reading a post-acceptance checklist.
 *
 * The repository hands the portal a `ChecklistView` — camp-authored
 * definitions joined to one profile's progress — and nothing else. Everything
 * a screen needs on top of that (which pile an item is in, how late it is,
 * where its button goes) is derived here rather than inside a component,
 * because three surfaces ask the same questions: the camps list, the checklist
 * itself, and each form page working out which item it is the destination for.
 *
 * Nothing here reads the clock. Lateness arrives pre-computed as
 * `daysUntilDue`, so the server render and the hydrating client cannot
 * disagree about what "3 days overdue" means.
 */

export type ChecklistGroupId = "action" | "waiting" | "done";

/**
 * Seven statuses, three piles, split by *who is holding the item* — the only
 * thing a parent actually wants to know: mine to do, ours to answer, finished.
 *
 * `action_needed` and `under_review` are the pair that must never be collapsed
 * into one "pending". One means the camp is waiting on the family, the other
 * means the family is waiting on the camp, and a badge covering both is how
 * people end up phoning the camp office to ask whose turn it is.
 */
const GROUP_BY_STATUS: Readonly<Record<ChecklistItemStatus, ChecklistGroupId>> = {
  not_started: "action",
  in_progress: "action",
  action_needed: "action",
  submitted: "waiting",
  under_review: "waiting",
  complete: "done",
  waived: "done",
};

export function checklistGroupFor(status: ChecklistItemStatus): ChecklistGroupId {
  return GROUP_BY_STATUS[status];
}

export interface ChecklistGroup {
  readonly id: ChecklistGroupId;
  readonly title: string;
  /** Says whose turn it is, in the family's words rather than the system's. */
  readonly description: string;
  readonly entries: readonly ChecklistEntry[];
}

const GROUP_COPY: Readonly<Record<ChecklistGroupId, { title: string; description: string }>> = {
  action: { title: "Your turn", description: "Nothing moves on these until you do something." },
  waiting: {
    title: "With the camp",
    description: "Sent in and waiting on us. There is nothing for you to do.",
  },
  done: { title: "Done", description: "Complete or waived for this camp." },
};

/** Presentation order: outstanding work first, finished work last. */
const GROUP_ORDER: readonly ChecklistGroupId[] = ["action", "waiting", "done"];

/** Groups in a fixed order, keeping the camp's own ordering inside each one. */
export function groupChecklistEntries(
  entries: readonly ChecklistEntry[],
): readonly ChecklistGroup[] {
  return GROUP_ORDER.map((id) => ({
    id,
    ...GROUP_COPY[id],
    entries: entries.filter((entry) => checklistGroupFor(entry.status) === id),
  })).filter((group) => group.entries.length > 0);
}

export function isChecklistEntryDone(entry: ChecklistEntry): boolean {
  return checklistGroupFor(entry.status) === "done";
}

/**
 * Overdue is a property of unfinished work only. An item signed a week after
 * its deadline is late history, not an outstanding task, and keeping it red
 * forever teaches families to ignore the colour.
 */
export function isChecklistEntryOverdue(entry: ChecklistEntry): boolean {
  return !isChecklistEntryDone(entry) && entry.daysUntilDue !== null && entry.daysUntilDue < 0;
}

/** Items the family still has to touch. Drives the count on the camps list. */
export function countNeedingAction(view: ChecklistView): number {
  return view.entries.filter((entry) => checklistGroupFor(entry.status) === "action").length;
}

export function countOverdue(view: ChecklistView): number {
  return view.entries.filter(isChecklistEntryOverdue).length;
}

/** 0–1, guarding the empty checklist so a progress bar never divides by zero. */
export function completionRatio(view: ChecklistView): number {
  return view.total === 0 ? 0 : view.completed / view.total;
}

export type DueTone = "overdue" | "soon" | "normal" | "none";

export interface DueLabel {
  readonly text: string;
  readonly tone: DueTone;
}

/**
 * How late, in the terms a deadline is actually felt in.
 *
 * "Due Sep 25" is useless at a glance and "-3" is worse; a parent scanning on a
 * phone wants "3 days overdue". Absolute dates come back once the deadline is
 * far enough out that counting days stops meaning anything.
 */
export function dueLabel(entry: ChecklistEntry): DueLabel {
  if (entry.dueDate === null || entry.daysUntilDue === null) {
    return { text: "No deadline", tone: "none" };
  }
  if (isChecklistEntryDone(entry)) {
    return { text: `Was due ${formatDate(entry.dueDate)}`, tone: "normal" };
  }

  const days = entry.daysUntilDue;
  if (days < 0) {
    const late = Math.abs(days);
    return { text: late === 1 ? "1 day overdue" : `${late} days overdue`, tone: "overdue" };
  }
  if (days === 0) return { text: "Due today", tone: "soon" };
  if (days === 1) return { text: "Due tomorrow", tone: "soon" };
  if (days <= 7) return { text: `Due in ${days} days`, tone: "soon" };
  return { text: `Due ${formatDate(entry.dueDate)}`, tone: "normal" };
}

/** Where an item's button goes, resolved from the typed target. */
export type ChecklistLink =
  | { readonly kind: "route"; readonly to: string; readonly label: string }
  | { readonly kind: "external"; readonly href: string; readonly label: string };

/** The four form pages a checklist item can point at. */
export type PortalFormTarget = "health" | "waivers" | "travel" | "payment";

const FORM_ROUTES: Readonly<Record<PortalFormTarget, { to: string; label: string }>> = {
  health: { to: "/my/health", label: "Open health forms" },
  waivers: { to: "/my/waivers", label: "Review and sign" },
  travel: { to: "/my/travel", label: "Add travel details" },
  payment: { to: "/my/payment", label: "Pay or set up a plan" },
};

/**
 * `ChecklistTarget` is a union rather than a string precisely so this can be a
 * total switch: a camp adding a new kind of destination breaks the build here
 * instead of rendering a dead button in front of a family.
 */
export function checklistLink(target: ChecklistTarget): ChecklistLink | null {
  switch (target.kind) {
    case "health":
    case "waivers":
    case "travel":
    case "payment":
      return { kind: "route", ...FORM_ROUTES[target.kind] };
    case "external":
      return { kind: "external", href: target.url, label: "Open" };
    case "none":
      return null;
  }
}

export interface ChecklistEntryLocation {
  readonly view: ChecklistView;
  readonly entry: ChecklistEntry;
}

/** Unfinished before finished, then soonest deadline, undated last. */
function urgency(entry: ChecklistEntry): number {
  return (isChecklistEntryDone(entry) ? 1_000_000 : 0) + (entry.daysUntilDue ?? 9_999);
}

/**
 * The reverse lookup: a form page asking "which checklist item am I the
 * destination for?", so it can name the child and camp and link back.
 *
 * Returns the most pressing match rather than the first, because a household
 * with two accepted children has two health items, and the overdue one is the
 * one the parent followed the link for.
 */
export function findEntryForTarget(
  views: readonly ChecklistView[],
  kind: PortalFormTarget,
): ChecklistEntryLocation | null {
  const matches: ChecklistEntryLocation[] = [];
  for (const view of views) {
    for (const entry of view.entries) {
      if (entry.definition.target.kind === kind) matches.push({ view, entry });
    }
  }

  return matches.sort((a, b) => urgency(a.entry) - urgency(b.entry)).at(0) ?? null;
}

export interface ChecklistDeadline extends ChecklistEntryLocation {
  readonly daysUntilDue: number;
}

/**
 * URL search for the checklist detail route.
 *
 * `CampChecklistCard` always supplies `profile`, but a bookmarked or
 * hand-typed link might not — an unrecognised or missing value should
 * degrade to "work it out from the instance" rather than throw.
 */
export interface ChecklistSearch {
  readonly profile?: string;
}

export function parseChecklistSearch(input: Record<string, unknown>): ChecklistSearch {
  const raw = input["profile"];
  return typeof raw === "string" && raw.length > 0 ? { profile: raw } : {};
}

/**
 * The single soonest outstanding deadline across every camp in the household.
 * One "what's next" line beats five progress bars on a 360px screen.
 */
export function nextDeadline(views: readonly ChecklistView[]): ChecklistDeadline | null {
  const pending: ChecklistDeadline[] = [];
  for (const view of views) {
    for (const entry of view.entries) {
      if (isChecklistEntryDone(entry) || entry.daysUntilDue === null) continue;
      pending.push({ view, entry, daysUntilDue: entry.daysUntilDue });
    }
  }

  return pending.sort((a, b) => a.daysUntilDue - b.daysUntilDue).at(0) ?? null;
}
