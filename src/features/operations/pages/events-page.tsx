import type { ProgramEventRow } from "../data";
import type { Region } from "../domain";
import { OperationsSection } from "../components/operations-section";
import { EventTable, FilterBar, FilterSelect } from "../components/programs";
import { formatLabel } from "../format";
import {
  ANY_OPTION,
  PROGRAM_EVENT_TYPES,
  hasActiveEventsFilters,
  type EventsSearch,
} from "../program-filters";

export interface EventProgramOption {
  readonly id: string;
  readonly name: string;
}

/**
 * The program event schedule: chronological, read-only, one row per event.
 *
 * No registration, attendance, reminders, calendar sync or editing — this
 * phase answers "what is happening and who is it for", nothing more.
 */
export function EventsPage({
  events,
  programs,
  regions,
  cycleYears,
  search,
  onSearchChange,
}: {
  events: readonly ProgramEventRow[];
  programs: readonly EventProgramOption[];
  regions: readonly Region[];
  cycleYears: readonly number[];
  search: EventsSearch;
  onSearchChange: (next: EventsSearch) => void;
}) {
  const isFiltered = hasActiveEventsFilters(search);

  function update(patch: Partial<Record<keyof EventsSearch, string>>) {
    const next: Record<string, unknown> = { ...search };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "" || value === ANY_OPTION) delete next[key];
      else next[key] = key === "year" ? Number(value) : value;
    }
    onSearchChange(next as EventsSearch);
  }

  return (
    <div className="space-y-6">
      <FilterBar
        searchLabel="Search events"
        searchPlaceholder="Event name or audience"
        searchValue={search.q ?? ""}
        onSearch={(value) => update({ q: value })}
        onReset={() => onSearchChange({})}
        isFiltered={isFiltered}
        resultSummary={`${events.length} upcoming event${events.length === 1 ? "" : "s"}`}
      >
        <FilterSelect
          id="events-filter-program"
          label="Program"
          anyLabel="All programs"
          value={search.program ?? ANY_OPTION}
          options={programs.map((program) => ({ value: program.id, label: program.name }))}
          onChange={(value) => update({ program: value })}
        />
        <FilterSelect
          id="events-filter-year"
          label="Cycle year"
          anyLabel="All years"
          value={search.year === undefined ? ANY_OPTION : String(search.year)}
          options={cycleYears.map((year) => ({ value: String(year), label: String(year) }))}
          onChange={(value) => update({ year: value })}
        />
        <FilterSelect
          id="events-filter-type"
          label="Event type"
          anyLabel="All types"
          value={search.type ?? ANY_OPTION}
          options={PROGRAM_EVENT_TYPES.map((type) => ({
            value: type,
            label: formatLabel(type),
          }))}
          onChange={(value) => update({ type: value })}
        />
        <FilterSelect
          id="events-filter-region"
          label="Region"
          anyLabel="All regions"
          value={search.region ?? ANY_OPTION}
          options={regions.map((region) => ({ value: region.id, label: region.name }))}
          onChange={(value) => update({ region: value })}
        />
      </FilterBar>

      <OperationsSection
        id="event-schedule"
        title="Upcoming events"
        description="Chronological. An event that serves several sessions is listed once, with each session it supports."
      >
        <EventTable
          rows={events}
          emptyMessage={
            isFiltered
              ? "No upcoming events match these filters. Clear them to see the whole schedule."
              : "Nothing is scheduled ahead of today."
          }
        />
      </OperationsSection>
    </div>
  );
}
