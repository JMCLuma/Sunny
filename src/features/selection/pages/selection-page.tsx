import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, OperationsSection } from "@/features/operations/components";
import { FilterSelect } from "@/features/operations/components/programs";
import type { ApplicationQueueRow, SelectionBoard } from "@/features/operations/data";
import type { ApplicationStatus, DecisionOutcome, Id } from "@/features/operations/domain";
import { formatLabel } from "@/features/operations/format";
import {
  ANY_OPTION,
  QUEUE_APPLICATION_STATUSES,
  type SelectionSearch,
  type SelectionSortKey,
} from "../application-filters";
import type { CohortSummary } from "../view-models";
import { QueueTable } from "../components/queue-table";

export interface SelectionInstanceOption {
  readonly id: string;
  readonly name: string;
}

/**
 * The decision screen for one session's cohort.
 *
 * `board` and `cohort` are computed by the loader from the same
 * permission-filtered row set, so the tallies above the table and the rows in
 * it can never disagree about who counts. The bulk-decision bar is present
 * only when `canDecide` is true — a reviewer who may score but not decide
 * never sees a control that would fail on click, per the module's access
 * rules.
 */
export function SelectionPage({
  board,
  cohort,
  rows,
  canDecide,
  instances,
  search,
  onSearchChange,
  onDecide,
}: {
  board: SelectionBoard;
  cohort: CohortSummary;
  rows: readonly ApplicationQueueRow[];
  canDecide: boolean;
  instances: readonly SelectionInstanceOption[];
  search: SelectionSearch;
  onSearchChange: (next: SelectionSearch) => void;
  onDecide: (submissionIds: readonly Id[], outcome: DecisionOutcome) => Promise<void>;
}) {
  const [selected, setSelected] = useState<ReadonlySet<Id>>(new Set());
  const [deciding, setDeciding] = useState<DecisionOutcome | null>(null);

  // Rows change under this screen constantly — a filter, a sort, a decision
  // just recorded — and a stale selection pointing at a row no longer shown
  // would let a bulk action silently apply to fewer applicants than displayed.
  useEffect(() => {
    setSelected((current) => {
      const visible = new Set(rows.map((row) => row.submission.id));
      const next = new Set([...current].filter((id) => visible.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [rows]);

  const sort = search.sort ?? "score";
  const dir = search.dir ?? "desc";

  function toggle(id: Id) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((current) => {
      const allSelected = rows.length > 0 && rows.every((row) => current.has(row.submission.id));
      return allSelected ? new Set() : new Set(rows.map((row) => row.submission.id));
    });
  }

  function onSort(key: SelectionSortKey) {
    const nextDir = sort === key && dir === "desc" ? "asc" : "desc";
    onSearchChange({ ...search, sort: key, dir: nextDir });
  }

  function onStatusFilter(value: string) {
    const { status: _status, ...rest } = search;
    onSearchChange(value === ANY_OPTION ? rest : { ...rest, status: value as ApplicationStatus });
  }

  async function decide(outcome: DecisionOutcome) {
    if (selected.size === 0) return;
    setDeciding(outcome);
    try {
      await onDecide([...selected], outcome);
      setSelected(new Set());
    } finally {
      setDeciding(null);
    }
  }

  return (
    <div className="space-y-6">
      {instances.length > 1 ? (
        <div className="max-w-xs">
          <Label htmlFor="selection-instance">Session</Label>
          <Select
            value={board.programInstanceId}
            onValueChange={(value) => onSearchChange({ ...search, instance: value })}
          >
            <SelectTrigger id="selection-instance" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {instances.map((instance) => (
                <SelectItem key={instance.id} value={instance.id}>
                  {instance.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <CohortSummaryCard board={board} cohort={cohort} />

      <OperationsSection
        id="selection-board"
        title="Cohort"
        description="Select applicants and record a decision for all of them at once."
        action={
          <FilterSelect
            id="selection-filter-status"
            label="Status"
            anyLabel="Any status"
            value={search.status ?? ANY_OPTION}
            options={QUEUE_APPLICATION_STATUSES.map((status) => ({
              value: status,
              label: formatLabel(status),
            }))}
            onChange={onStatusFilter}
          />
        }
      >
        {canDecide ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <Button
              type="button"
              size="sm"
              disabled={selected.size === 0 || deciding !== null}
              onClick={() => void decide("accept")}
            >
              {deciding === "accept" ? "Accepting…" : "Accept"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={selected.size === 0 || deciding !== null}
              onClick={() => void decide("waitlist")}
            >
              {deciding === "waitlist" ? "Waitlisting…" : "Waitlist"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={selected.size === 0 || deciding !== null}
              onClick={() => void decide("reject")}
            >
              {deciding === "reject" ? "Rejecting…" : "Reject"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Accepting sets a confirm-by date; a family that misses it is moved back to the
              waitlist automatically.
            </span>
          </div>
        ) : (
          <p className="mb-4 text-sm text-muted-foreground">
            Your role can view this cohort but not record decisions for it.
          </p>
        )}

        {rows.length === 0 ? (
          <EmptyState message="No applications match the current status filter." />
        ) : (
          <QueueTable
            rows={rows}
            emptyMessage="No applications to show."
            identified
            {...(canDecide
              ? { selection: { selected, onToggle: toggle, onToggleAll: toggleAll } }
              : {})}
            sort={{ key: sort, dir, onSort }}
          />
        )}
      </OperationsSection>
    </div>
  );
}

function CohortSummaryCard({ board, cohort }: { board: SelectionBoard; cohort: CohortSummary }) {
  return (
    <OperationsSection
      id="cohort-summary"
      title={`${board.instanceName} — cohort at a glance`}
      description={`${board.programName} · planned capacity ${cohort.plannedCapacity}`}
      action={cohort.overCapacity ? <Badge variant="destructive">Over capacity</Badge> : null}
    >
      <div className="space-y-2">
        <Progress value={Math.round(cohort.fill * 100)} />
        <p className="text-sm text-muted-foreground">
          {cohort.placed} placed of {cohort.plannedCapacity} planned ({cohort.remaining} remaining)
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Awaiting confirmation" value={cohort.awaitingConfirmation} />
        <SummaryStat label="Waitlisted" value={cohort.waitlisted} />
        <SummaryStat label="Undecided" value={cohort.undecided} />
        <SummaryStat label="Closed" value={cohort.closed} />
      </dl>

      {board.countsByRegion.length > 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          By region:{" "}
          {board.countsByRegion.map((entry) => `${entry.label} (${entry.count})`).join(" · ")}
        </p>
      ) : null}
    </OperationsSection>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-bold tabular-nums">{value}</dd>
    </div>
  );
}
