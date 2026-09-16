import { Link } from "@tanstack/react-router";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProgramInstanceSummary } from "../../data";
import { formatDateRange } from "../../format";
import { EmptyState } from "../empty-state";
import { StatusBadge } from "../status-badge";

/** Counts, not a per-area breakdown: the detail page is where areas belong. */
function ReadinessCell({ readiness }: { readiness: ProgramInstanceSummary["readiness"] }) {
  if (readiness.tracked === 0) {
    return <span className="text-muted-foreground">Not tracked</span>;
  }
  if (readiness.needsAttention > 0) {
    return (
      <span className="font-medium text-destructive">
        {readiness.needsAttention} need{readiness.needsAttention === 1 ? "s" : ""} attention
      </span>
    );
  }
  return (
    <span className="text-muted-foreground">
      {readiness.ready} of {readiness.tracked} ready
    </span>
  );
}

export function InstanceTable({
  rows,
  emptyMessage,
  showProgram = false,
}: {
  rows: readonly ProgramInstanceSummary[];
  emptyMessage: string;
  showProgram?: boolean;
}) {
  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Session</TableHead>
          {showProgram ? <TableHead scope="col">Program</TableHead> : null}
          <TableHead scope="col">Region</TableHead>
          <TableHead scope="col">Cycle</TableHead>
          <TableHead scope="col">Dates</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Readiness</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ instance, programName, region, readiness }) => (
          <TableRow key={instance.id}>
            <TableCell className="font-medium">
              <Link
                to="/operations/programs/$programId/instances/$instanceId"
                params={{ programId: instance.programId, instanceId: instance.id }}
                className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {instance.name}
              </Link>
            </TableCell>
            {showProgram ? (
              <TableCell className="text-muted-foreground">{programName}</TableCell>
            ) : null}
            <TableCell className="text-muted-foreground">{region?.name ?? "—"}</TableCell>
            <TableCell className="tabular-nums text-muted-foreground">
              {instance.cycleYear}
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formatDateRange(instance.startDate, instance.endDate)}
              {instance.startDate !== null && !instance.datesConfirmed ? (
                <span className="ml-1 text-xs">(tentative)</span>
              ) : null}
            </TableCell>
            <TableCell>
              <StatusBadge status={instance.status} />
            </TableCell>
            <TableCell className="text-sm">
              <ReadinessCell readiness={readiness} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
