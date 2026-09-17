import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/features/operations/components";
import { StatusBadge } from "@/features/operations/components/status-badge";
import type { ApplicationQueueRow } from "@/features/operations/data";
import { formatLabel } from "@/features/operations/format";
import type { Id } from "@/features/operations/domain";
import type { SelectionSortKey, SortDirection } from "../application-filters";

/**
 * The applications table, used by both the queue and the selection board.
 *
 * One component rather than two, because they are the same table with
 * different affordances switched on: the board adds row selection and sortable
 * headers, and nothing else about a row changes between the screens. Two copies
 * would drift, and a row that means one thing in the queue and another on the
 * board is exactly the confusion a selection screen cannot afford.
 *
 * Ten columns do not fit a phone, so the table scrolls horizontally inside its
 * own region rather than stretching the page; the applicant column stays first
 * so a narrow viewport still shows who each row is.
 */

export interface QueueSelection {
  readonly selected: ReadonlySet<Id>;
  readonly onToggle: (submissionId: Id) => void;
  readonly onToggleAll: () => void;
}

export interface QueueSort {
  readonly key: SelectionSortKey;
  readonly dir: SortDirection;
  readonly onSort: (key: SelectionSortKey) => void;
}

export function QueueTable({
  rows,
  emptyMessage,
  identified,
  selection,
  sort,
}: {
  rows: readonly ApplicationQueueRow[];
  emptyMessage: string;
  /** Carried into the detail link so opening a row cannot unmask a blind review. */
  identified: boolean;
  selection?: QueueSelection;
  sort?: QueueSort;
}) {
  if (rows.length === 0) return <EmptyState message={emptyMessage} />;

  const allSelected =
    selection !== undefined &&
    rows.length > 0 &&
    rows.every((row) => selection.selected.has(row.submission.id));

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {selection ? (
              <TableHead scope="col" className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={selection.onToggleAll}
                  aria-label={allSelected ? "Clear selection" : "Select every row shown"}
                />
              </TableHead>
            ) : null}
            <SortableHead sort={sort} sortKey="name">
              Applicant
            </SortableHead>
            <TableHead scope="col">Camp</TableHead>
            <TableHead scope="col">Session</TableHead>
            <SortableHead sort={sort} sortKey="region">
              Region
            </SortableHead>
            <TableHead scope="col">Age</TableHead>
            <SortableHead sort={sort} sortKey="status">
              Status
            </SortableHead>
            <SortableHead sort={sort} sortKey="score">
              Score
            </SortableHead>
            <TableHead scope="col">Interview</TableHead>
            <TableHead scope="col">Decision</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const isSelected = selection?.selected.has(row.submission.id) ?? false;
            return (
              <TableRow key={row.submission.id} data-state={isSelected ? "selected" : undefined}>
                {selection ? (
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => selection.onToggle(row.submission.id)}
                      aria-label={`Select ${row.applicantLabel}`}
                    />
                  </TableCell>
                ) : null}
                <TableCell className="font-medium">
                  <Link
                    to="/operations/applications/$submissionId"
                    params={{ submissionId: row.submission.id }}
                    search={identified ? { identified: true } : {}}
                    className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {row.applicantLabel}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {row.programName}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {row.instanceName}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {row.regionName ?? "—"}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {row.age ?? "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.submission.status} />
                </TableCell>
                <TableCell className="tabular-nums">
                  {row.totalScore === null ? (
                    <span className="text-muted-foreground">Not scored</span>
                  ) : (
                    <span className="font-medium">
                      {row.totalScore}
                      {row.scoredBy > 1 ? (
                        <span className="ms-1 text-xs text-muted-foreground">
                          ({row.scoredBy} reviewers)
                        </span>
                      ) : null}
                    </span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {row.interviewStatus === null ? "—" : formatLabel(row.interviewStatus)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {row.decision === null ? (
                    <span className="text-muted-foreground">Undecided</span>
                  ) : (
                    <StatusBadge status={row.decision} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/** A header that sorts when the screen supports it, and is plain text when not. */
function SortableHead({
  sort,
  sortKey,
  children,
}: {
  sort: QueueSort | undefined;
  sortKey: SelectionSortKey;
  children: ReactNode;
}) {
  if (!sort) {
    return <TableHead scope="col">{children}</TableHead>;
  }

  const active = sort.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead
      scope="col"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => sort.onSort(sortKey)}
        className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
        <Icon className="size-3.5" aria-hidden="true" />
      </button>
    </TableHead>
  );
}
