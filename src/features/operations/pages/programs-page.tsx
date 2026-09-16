import { Link } from "@tanstack/react-router";

import type { ProgramSummary } from "../data";
import type { Region } from "../domain";
import { EmptyState } from "../components/empty-state";
import { OperationsSection } from "../components/operations-section";
import { StatusBadge } from "../components/status-badge";
import { FilterBar, FilterSelect, InstanceTable } from "../components/programs";
import { formatLabel } from "../format";
import {
  ANY_OPTION,
  PROGRAM_INSTANCE_STATUSES,
  hasActiveProgramsFilters,
  type ProgramsSearch,
} from "../program-filters";

/**
 * The Programs portfolio.
 *
 * Everything shown has already been filtered by the route loader, both by the
 * URL filters and by what the actor may see — this component renders what it
 * is given and makes no access decisions of its own.
 */
export function ProgramsPage({
  programs,
  regions,
  cycleYears,
  search,
  onSearchChange,
}: {
  programs: readonly ProgramSummary[];
  regions: readonly Region[];
  cycleYears: readonly number[];
  search: ProgramsSearch;
  onSearchChange: (next: ProgramsSearch) => void;
}) {
  const sessionCount = programs.reduce((total, row) => total + row.instanceCount, 0);
  const upcomingCount = programs.reduce((total, row) => total + row.upcomingInstances, 0);
  const isFiltered = hasActiveProgramsFilters(search);

  function update(patch: Partial<Record<keyof ProgramsSearch, string>>) {
    const next: Record<string, unknown> = { ...search };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "" || value === ANY_OPTION) delete next[key];
      else next[key] = key === "year" ? Number(value) : value;
    }
    onSearchChange(next as ProgramsSearch);
  }

  return (
    <div className="space-y-6">
      <FilterBar
        searchLabel="Search programs and sessions"
        searchPlaceholder="Program or session name"
        searchValue={search.q ?? ""}
        onSearch={(value) => update({ q: value })}
        onReset={() => onSearchChange({})}
        isFiltered={isFiltered}
        resultSummary={`${programs.length} program${programs.length === 1 ? "" : "s"} · ${sessionCount} session${
          sessionCount === 1 ? "" : "s"
        } · ${upcomingCount} upcoming`}
      >
        <FilterSelect
          id="programs-filter-year"
          label="Cycle year"
          anyLabel="All years"
          value={search.year === undefined ? ANY_OPTION : String(search.year)}
          options={cycleYears.map((year) => ({ value: String(year), label: String(year) }))}
          onChange={(value) => update({ year: value })}
        />
        <FilterSelect
          id="programs-filter-region"
          label="Region"
          anyLabel="All regions"
          value={search.region ?? ANY_OPTION}
          options={regions.map((region) => ({ value: region.id, label: region.name }))}
          onChange={(value) => update({ region: value })}
        />
        <FilterSelect
          id="programs-filter-status"
          label="Session status"
          anyLabel="Any status"
          value={search.status ?? ANY_OPTION}
          options={PROGRAM_INSTANCE_STATUSES.map((status) => ({
            value: status,
            label: formatLabel(status),
          }))}
          onChange={(value) => update({ status: value })}
        />
      </FilterBar>

      <p className="text-sm">
        <Link
          to="/operations/programs/events"
          className="underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View the full event schedule
        </Link>
      </p>

      {programs.length === 0 ? (
        <OperationsSection id="programs" title="Programs">
          <EmptyState
            message={
              isFiltered
                ? "No programs match these filters. Clear them to see the full portfolio."
                : "No programs have been set up yet."
            }
          />
        </OperationsSection>
      ) : (
        <div className="space-y-6">
          {programs.map((row) => (
            <OperationsSection
              key={row.program.id}
              id={`program-${row.program.id}`}
              title={row.program.name}
              description={row.program.summary}
              action={<StatusBadge status={row.program.status} />}
            >
              <p className="mb-3 text-sm text-muted-foreground">
                {row.instanceCount} session{row.instanceCount === 1 ? "" : "s"} ·{" "}
                {row.activeInstances} in flight · {row.upcomingInstances} upcoming ·{" "}
                {row.regions.length === 0
                  ? "no region yet"
                  : row.regions.map((region) => region.name).join(", ")}
              </p>
              <InstanceTable
                rows={row.instances}
                emptyMessage="This program has no sessions matching the current filters."
              />
              <p className="mt-3 text-sm">
                <Link
                  to="/operations/programs/$programId"
                  params={{ programId: row.program.id }}
                  className="underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Open {row.program.name}
                </Link>
              </p>
            </OperationsSection>
          ))}
        </div>
      )}
    </div>
  );
}
