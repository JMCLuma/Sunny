import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Check, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ChecklistEntry } from "@/features/operations/domain";
import { cn } from "@/lib/utils";

import {
  checklistLink,
  dueLabel,
  isChecklistEntryDone,
  isChecklistEntryOverdue,
  type DueTone,
} from "../checklist-view";
import { ChecklistIcon } from "./checklist-icon";
import { ChecklistStatusBadge } from "./checklist-status-badge";

/**
 * One checklist item.
 *
 * Everything on the row comes from the camp's own definition — title, blurb,
 * icon and destination — so a camp adding an item gets a properly rendered
 * row, not a generic one. Nothing about "health form" or "waiver" is special
 * cased here; the row cannot tell the difference between a platform item and
 * "Read the packing list", which is the point.
 *
 * Built to stack at 360px: title, then sub-status, then the badges, then a
 * full-width button. Side-by-side only once there is room for it, because a
 * truncated deadline is worse than a taller card.
 */
const DUE_TONES: Readonly<Record<DueTone, string>> = {
  overdue: "font-semibold text-destructive",
  soon: "font-medium text-foreground",
  normal: "text-muted-foreground",
  none: "text-muted-foreground",
};

export function ChecklistItemRow({
  entry,
  onComplete,
}: {
  entry: ChecklistEntry;
  /**
   * Omitted where the item is not the family's to close. Present, it is the
   * demo's shortcut past a form — see the note on the checklist page.
   */
  onComplete?: (definitionId: string) => void;
}) {
  const { definition } = entry;
  const link = checklistLink(definition.target);
  const due = dueLabel(entry);
  const done = isChecklistEntryDone(entry);
  const overdue = isChecklistEntryOverdue(entry);

  return (
    <li
      className={cn(
        "rounded-md border border-border bg-card p-3 sm:p-4",
        // A colour-blind-safe second signal for lateness: the badge says it in
        // words, the border says it at a glance.
        overdue && "border-s-4 border-s-destructive",
        done && "bg-muted/40",
      )}
    >
      <div className="flex gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md",
            done ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground",
          )}
        >
          <ChecklistIcon name={definition.icon} />
        </span>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-1">
            <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold">
              <span className={cn(done && "text-muted-foreground")}>{definition.title}</span>
              {definition.required ? null : (
                <span className="text-xs font-normal text-muted-foreground">Optional</span>
              )}
            </p>
            {definition.description ? (
              <p className="text-sm text-muted-foreground">{definition.description}</p>
            ) : null}
          </div>

          {/* The camp's own note on where the item has got to. Worth more than
              the status word above it, so it is not hidden behind a tooltip. */}
          {entry.progress?.subStatus ? (
            <p className="rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
              {entry.progress.subStatus}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <ChecklistStatusBadge status={entry.status} />
            <span className={cn("text-xs", DUE_TONES[due.tone])}>{due.text}</span>
          </div>

          {done ? null : (
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
              {link === null ? null : link.kind === "route" ? (
                <Button asChild size="sm" className="w-full sm:w-auto">
                  <Link to={link.to}>
                    {link.label}
                    <ChevronRight aria-hidden className="size-4 rtl:rotate-180" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="secondary" className="w-full sm:w-auto">
                  <a href={link.href}>
                    {link.label}
                    <ArrowUpRight aria-hidden className="size-4 rtl:-scale-x-100" />
                  </a>
                </Button>
              )}

              {onComplete ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-muted-foreground sm:w-auto"
                  onClick={() => onComplete(definition.id)}
                >
                  <Check aria-hidden className="size-4" />
                  Mark as done
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
