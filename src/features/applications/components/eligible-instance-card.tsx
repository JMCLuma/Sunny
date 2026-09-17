import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatDate, formatDateRange } from "@/features/operations/format";
import type { EligibleInstanceRow } from "@/features/operations/data";
import { cn } from "@/lib/utils";

import { reasonLines } from "../view-models";

/**
 * One camp on the eligibility list, whichever of the three things it is.
 *
 * The whole point of this screen: a camp a profile cannot attend is a row
 * here with a reason, never an omission. The 09-09 call was specific about
 * why — a camp that silently disappears reads as a bug and becomes a support
 * email, one that explains itself does not.
 */
export function EligibleInstanceCard({
  row,
  selectable,
  selected,
  onToggleSelected,
}: {
  row: EligibleInstanceRow;
  /** True only for an eligible row with an open form and no submission yet. */
  selectable: boolean;
  selected: boolean;
  onToggleSelected: (checked: boolean) => void;
}) {
  const checkboxId = `camp-${row.instance.id}`;
  const reasons = reasonLines(row.result.reasons);

  return (
    <li
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        selected && "border-primary ring-1 ring-primary",
      )}
    >
      <div className="flex items-start gap-3">
        {selectable ? (
          <Checkbox
            id={checkboxId}
            checked={selected}
            onCheckedChange={(next) => onToggleSelected(next === true)}
            className="mt-0.5"
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <Label
            htmlFor={selectable ? checkboxId : undefined}
            className={cn("block text-base font-bold", !selectable && "cursor-default")}
          >
            {row.programName}
          </Label>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {row.instance.name}
            {row.region ? ` · ${row.region.name}` : ""}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatDateRange(row.instance.startDate, row.instance.endDate)}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <VerdictBadge row={row} />
            {row.deadline ? (
              <span className="text-xs text-muted-foreground">
                Applications close {formatDate(row.deadline)}
              </span>
            ) : null}
          </div>

          {reasons.length > 0 ? (
            <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
              {reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function VerdictBadge({ row }: { row: EligibleInstanceRow }) {
  if (row.result.verdict === "not_eligible") {
    return <Badge variant="destructive">Not eligible</Badge>;
  }
  if (row.result.verdict === "unknown") {
    return <Badge variant="outline">Add info to check</Badge>;
  }
  if (row.existingSubmissionId) {
    return <Badge variant="secondary">Already applied</Badge>;
  }
  if (!row.formId) {
    return <Badge variant="outline">Not open for applications yet</Badge>;
  }
  return <Badge>Eligible</Badge>;
}
