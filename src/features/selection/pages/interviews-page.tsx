import { ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, OperationsSection } from "@/features/operations/components";
import { FilterSelect } from "@/features/operations/components/programs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/features/operations/components/status-badge";
import type { Id, Interview } from "@/features/operations/domain";
import { formatDate, formatDateTime, formatLabel } from "@/features/operations/format";
import { ANY_OPTION, INTERVIEW_STATUSES, type InterviewsSearch } from "../interviews-filters";
import type { InterviewSummary } from "../view-models";

export interface InterviewRow {
  readonly interview: Interview;
  readonly applicantLabel: string;
  readonly programName: string;
  readonly instanceName: string;
  /** `null` when unassigned, or when the directory has no record for them. */
  readonly interviewerName: string | null;
}

export interface InterviewInstanceOption {
  readonly id: Id;
  readonly name: string;
}

/**
 * Interviews across whichever sessions the actor's scope reaches.
 *
 * The retention rule is surfaced rather than left for someone to remember:
 * IUSA requires interview notes to be purged at the end of the cycle, so the
 * earliest purge date across the visible rows is shown up front, not buried
 * in a detail view nobody opens.
 */
export function InterviewsPage({
  rows,
  summary,
  instances,
  search,
  onSearchChange,
}: {
  rows: readonly InterviewRow[];
  summary: InterviewSummary;
  instances: readonly InterviewInstanceOption[];
  search: InterviewsSearch;
  onSearchChange: (next: InterviewsSearch) => void;
}) {
  function update(patch: Partial<Record<keyof InterviewsSearch, string>>) {
    const next: Record<string, unknown> = { ...search };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "" || value === ANY_OPTION) delete next[key];
      else next[key] = value;
    }
    onSearchChange(next as InterviewsSearch);
  }

  const isFiltered = Object.keys(search).length > 0;

  return (
    <div className="space-y-6">
      {summary.withNotes > 0 ? (
        <Alert>
          <ShieldAlert className="size-4" aria-hidden="true" />
          <AlertTitle>Interview notes are purged at cycle end</AlertTitle>
          <AlertDescription>
            {summary.withNotes} interview{summary.withNotes === 1 ? "" : "s"} carr
            {summary.withNotes === 1 ? "ies" : "y"} notes.
            {summary.earliestPurge
              ? ` The earliest are scheduled to be purged on ${formatDate(
                  summary.earliestPurge,
                )}, per IUSA's retention requirement.`
              : ""}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect
            id="interviews-filter-instance"
            label="Session"
            anyLabel="All sessions"
            value={search.instance ?? ANY_OPTION}
            options={instances.map((instance) => ({ value: instance.id, label: instance.name }))}
            onChange={(value) => update({ instance: value })}
          />
          <FilterSelect
            id="interviews-filter-status"
            label="Status"
            anyLabel="Any status"
            value={search.status ?? ANY_OPTION}
            options={INTERVIEW_STATUSES.map((status) => ({
              value: status,
              label: formatLabel(status),
            }))}
            onChange={(value) => update({ status: value })}
          />
          {isFiltered ? (
            <Button type="button" variant="ghost" onClick={() => onSearchChange({})}>
              Clear filters
            </Button>
          ) : null}
        </div>
        <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
          {rows.length} interview{rows.length === 1 ? "" : "s"} · {summary.counts.scheduled}{" "}
          scheduled · {summary.counts.completed} completed · {summary.counts.no_show} no-show
        </p>
      </div>

      <OperationsSection id="interviews" title="Interviews">
        {rows.length === 0 ? (
          <EmptyState
            message={
              isFiltered ? "No interviews match these filters." : "No interviews are scheduled yet."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Applicant</TableHead>
                  <TableHead scope="col">Camp</TableHead>
                  <TableHead scope="col">Session</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col">When</TableHead>
                  <TableHead scope="col">Interviewer</TableHead>
                  <TableHead scope="col">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(
                  ({ interview, applicantLabel, programName, instanceName, interviewerName }) => (
                    <TableRow key={interview.id}>
                      <TableCell className="font-medium">{applicantLabel}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {programName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {instanceName}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={interview.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {interview.scheduledFor ? formatDateTime(interview.scheduledFor) : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {interviewerName ?? "Unassigned"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {interview.notes ? (
                          <span title={interview.notes}>
                            Held
                            {interview.notesPurgeAfter
                              ? ` · purges ${formatDate(interview.notesPurgeAfter)}`
                              : ""}
                          </span>
                        ) : (
                          "None"
                        )}
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </OperationsSection>
    </div>
  );
}
