import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState, OperationsSection } from "@/features/operations/components";
import { FilterBar, FilterSelect } from "@/features/operations/components/programs";
import type { Program, Region } from "@/features/operations/domain";
import { formatLabel } from "@/features/operations/format";
import {
  ANY_OPTION,
  APPLICATION_AUDIENCES,
  QUEUE_APPLICATION_STATUSES,
  hasActiveQueueFilters,
  type QueueSearch,
} from "../application-filters";
import type { recountBoard } from "../access";
import { QueueTable } from "../components/queue-table";
import type { ApplicationQueueRow } from "@/features/operations/data";

/** The shape `recountBoard` returns — no named export for it, so derived here. */
export type ApplicationBoardCounts = ReturnType<typeof recountBoard>;

/** The instance names the instance filter offers — a narrower shape than `ProgramInstance`. */
export interface QueueInstanceOption {
  readonly id: string;
  readonly name: string;
}

/**
 * The applications queue — every submission a reviewer's scope reaches, dense
 * and filterable.
 *
 * `rows` and `counts` have already been through `filterQueueRows` and
 * `recountBoard` in the route loader: what this component displays and what it
 * counts are the same set, so "38 applications" can never mean more than a
 * reviewer can actually open. Facet options are pre-narrowed the same way, so
 * a select never advertises a program, session or region a filter would then
 * silently return nothing for.
 */
export function ApplicationQueuePage({
  rows,
  counts,
  programs,
  regions,
  instances,
  canExport,
  search,
  onSearchChange,
}: {
  rows: readonly ApplicationQueueRow[];
  counts: ApplicationBoardCounts;
  programs: readonly Program[];
  regions: readonly Region[];
  instances: readonly QueueInstanceOption[];
  canExport: boolean;
  search: QueueSearch;
  onSearchChange: (next: QueueSearch) => void;
}) {
  const isFiltered = hasActiveQueueFilters(search);

  function update(patch: Partial<Record<keyof QueueSearch, string>>) {
    const next: Record<string, unknown> = { ...search };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "" || value === ANY_OPTION) delete next[key];
      else next[key] = value;
    }
    onSearchChange(next as QueueSearch);
  }

  const statusSummary = QUEUE_APPLICATION_STATUSES.filter(
    (status) => (counts.countsByStatus[status] ?? 0) > 0,
  )
    .map((status) => `${counts.countsByStatus[status]} ${formatLabel(status).toLowerCase()}`)
    .join(" · ");

  return (
    <div className="space-y-6">
      <FilterBar
        searchLabel="Search applicants"
        searchPlaceholder="Applicant name or reference"
        searchValue={search.q ?? ""}
        onSearch={(value) => update({ q: value })}
        onReset={() => onSearchChange({})}
        isFiltered={isFiltered}
        resultSummary={
          rows.length === 0
            ? "No applications match these filters."
            : `${rows.length} application${rows.length === 1 ? "" : "s"}${
                statusSummary ? ` · ${statusSummary}` : ""
              }`
        }
      >
        <FilterSelect
          id="applications-filter-program"
          label="Camp"
          anyLabel="All camps"
          value={search.program ?? ANY_OPTION}
          options={programs.map((program) => ({ value: program.id, label: program.name }))}
          onChange={(value) => update({ program: value })}
        />
        <FilterSelect
          id="applications-filter-instance"
          label="Session"
          anyLabel="All sessions"
          value={search.instance ?? ANY_OPTION}
          options={instances.map((instance) => ({ value: instance.id, label: instance.name }))}
          onChange={(value) => update({ instance: value })}
        />
        <FilterSelect
          id="applications-filter-region"
          label="Region"
          anyLabel="All regions"
          value={search.region ?? ANY_OPTION}
          options={regions.map((region) => ({ value: region.id, label: region.name }))}
          onChange={(value) => update({ region: value })}
        />
        <FilterSelect
          id="applications-filter-audience"
          label="Audience"
          anyLabel="Participant & staff"
          value={search.audience ?? ANY_OPTION}
          options={APPLICATION_AUDIENCES.map((audience) => ({
            value: audience,
            label: formatLabel(audience),
          }))}
          onChange={(value) => update({ audience: value })}
        />
        <FilterSelect
          id="applications-filter-status"
          label="Status"
          anyLabel="Any status"
          value={search.status ?? ANY_OPTION}
          options={QUEUE_APPLICATION_STATUSES.map((status) => ({
            value: status,
            label: formatLabel(status),
          }))}
          onChange={(value) => update({ status: value })}
        />
      </FilterBar>

      <OperationsSection
        id="applications-queue"
        title="Applications"
        description="Every submission your access reaches, across camps and sessions."
        action={<ExportButton enabled={canExport} />}
      >
        {rows.length === 0 ? (
          <EmptyState
            message={
              isFiltered
                ? "No applications match these filters. Clear them to see the full queue."
                : "No applications have been submitted yet."
            }
          />
        ) : (
          <QueueTable rows={rows} emptyMessage="No applications to show." identified />
        )}
      </OperationsSection>
    </div>
  );
}

/**
 * Always present, never wired. The demo's data contract has no export
 * pipeline behind it, and pretending otherwise with a silently-failing click
 * is worse than a button that says so.
 */
function ExportButton({ enabled }: { enabled: boolean }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button type="button" variant="outline" size="sm" disabled={!enabled}>
              <Download className="me-2 size-4" aria-hidden="true" />
              Export
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {enabled
            ? "Not wired in this demo — no export pipeline exists yet."
            : "Your role doesn't hold export access for any session in this queue."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
