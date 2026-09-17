import {
  CircleCheckBig,
  CircleDashed,
  CircleMinus,
  Hourglass,
  PencilLine,
  Send,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ChecklistItemStatus } from "@/features/operations/domain";
import { cn } from "@/lib/utils";

/**
 * One badge per checklist status — all seven of them, spelled out.
 *
 * `StatusBadge` in Operations covers four of these and falls back to a neutral
 * outline for the rest, which is fine in a table an administrator reads all
 * day and wrong here. The three it does not know are the three that carry the
 * most meaning to a family: `action_needed` ("we looked, and something is
 * wrong"), `under_review` ("we have it, wait") and `waived` ("you do not have
 * to do this one"). Rendering any of those as a grey outline turns a checklist
 * into a phone call.
 *
 * Wording is the family's, not the system's: "We're reviewing it", not
 * "Under review", because the badge answers *whose turn is it*.
 */
interface StatusStyle {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly variant: "default" | "secondary" | "destructive" | "outline";
  readonly className?: string;
}

const STATUS_STYLES: Readonly<Record<ChecklistItemStatus, StatusStyle>> = {
  not_started: { label: "Not started", icon: CircleDashed, variant: "outline" },
  in_progress: { label: "In progress", icon: PencilLine, variant: "secondary" },
  submitted: { label: "Submitted", icon: Send, variant: "secondary" },
  under_review: {
    label: "We're reviewing it",
    icon: Hourglass,
    variant: "outline",
    // Distinct from the plain outline of "not started": nothing is owed by the
    // family here, and the badge should look like waiting rather than absence.
    className: "border-primary/40 bg-secondary text-secondary-foreground",
  },
  action_needed: { label: "Needs your attention", icon: TriangleAlert, variant: "destructive" },
  complete: { label: "Done", icon: CircleCheckBig, variant: "default" },
  waived: {
    label: "Waived",
    icon: CircleMinus,
    variant: "outline",
    className: "border-dashed text-muted-foreground",
  },
};

export function ChecklistStatusBadge({
  status,
  className,
}: {
  status: ChecklistItemStatus;
  className?: string;
}) {
  const style = STATUS_STYLES[status];
  const Icon = style.icon;

  return (
    <Badge variant={style.variant} className={cn("gap-1.5", style.className, className)}>
      <Icon aria-hidden className="size-3" />
      {style.label}
    </Badge>
  );
}
