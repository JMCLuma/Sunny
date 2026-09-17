import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChecklistView } from "@/features/operations/data";

import { countNeedingAction, countOverdue, dueLabel, nextDeadline } from "../checklist-view";
import { ChecklistProgressBar } from "./checklist-progress";

/**
 * One accepted child at one camp, as a card on the camps list.
 *
 * A household can hold several of these — two children at the same camp, or
 * one child at two — so the card leads with *whose* it is. The camp name comes
 * second because a parent recognises their own child faster than they
 * recognise a session name, and at 360px only one of the two fits on a line.
 *
 * The card summarises and does not list: counts, the next deadline, and a way
 * in. The full set of items lives one tap away, where there is room for it.
 */
export function CampChecklistCard({ view }: { view: ChecklistView }) {
  const needsAction = countNeedingAction(view);
  const overdue = countOverdue(view);
  const next = nextDeadline([view]);
  const allDone = view.completed === view.total;

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold">{view.profileName}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {view.programName} · {view.instanceName}
          </p>
        </div>
        {overdue > 0 ? (
          <Badge variant="destructive" className="shrink-0">
            {overdue} overdue
          </Badge>
        ) : allDone ? (
          <Badge className="shrink-0">All done</Badge>
        ) : (
          <Badge variant="secondary" className="shrink-0">
            {needsAction} to do
          </Badge>
        )}
      </div>

      <ChecklistProgressBar completed={view.completed} total={view.total} className="mt-4" />

      {next ? (
        <p className="mt-3 text-sm">
          <span className="text-muted-foreground">Next: </span>
          <span className="font-medium">{next.entry.definition.title}</span>
          <span className="text-muted-foreground">
            {" "}
            — {dueLabel(next.entry).text.toLowerCase()}
          </span>
        </p>
      ) : null}

      <Button asChild className="mt-4 w-full sm:w-auto">
        <Link
          to="/my/programs/$instanceId"
          params={{ instanceId: view.programInstanceId }}
          search={{ profile: view.profileId }}
        >
          Open checklist
          <ChevronRight aria-hidden className="size-4 rtl:rotate-180" />
        </Link>
      </Button>
    </li>
  );
}
