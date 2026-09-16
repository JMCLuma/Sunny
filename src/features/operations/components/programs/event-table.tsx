import { Link } from "@tanstack/react-router";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProgramEventRow } from "../../data";
import { formatDateTimeRange, formatLabel } from "../../format";
import { EmptyState } from "../empty-state";
import { StatusBadge } from "../status-badge";

const DELIVERY_LABEL: Readonly<Record<string, string>> = {
  in_person: "In person",
  virtual: "Virtual",
  hybrid: "Hybrid",
};

/**
 * One row per event, however many instances it serves — the whole reason
 * events link to a list of instances instead of being copied per instance.
 */
function LinkedInstances({ instances }: { instances: ProgramEventRow["instances"] }) {
  if (instances.length === 0) {
    return <span className="text-muted-foreground">Program-wide</span>;
  }

  return (
    <ul className="space-y-0.5">
      {instances.map((instance) => (
        <li key={instance.id}>
          <Link
            to="/operations/programs/$programId/instances/$instanceId"
            params={{ programId: instance.programId, instanceId: instance.id }}
            className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {instance.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function EventTable({
  rows,
  emptyMessage,
  showProgram = true,
}: {
  rows: readonly ProgramEventRow[];
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
          <TableHead scope="col">Event</TableHead>
          {showProgram ? <TableHead scope="col">Program</TableHead> : null}
          <TableHead scope="col">Type</TableHead>
          <TableHead scope="col">Audience</TableHead>
          <TableHead scope="col">When</TableHead>
          <TableHead scope="col">Where</TableHead>
          <TableHead scope="col">Sessions served</TableHead>
          <TableHead scope="col">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ event, programName, instances }) => (
          <TableRow key={event.id}>
            <TableCell className="font-medium">{event.title}</TableCell>
            {showProgram ? (
              <TableCell className="text-muted-foreground">{programName}</TableCell>
            ) : null}
            <TableCell className="text-muted-foreground">{formatLabel(event.eventType)}</TableCell>
            <TableCell className="text-muted-foreground">{event.audienceLabel}</TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formatDateTimeRange(event.startsAt, event.endsAt)}
              {event.timeZone ? (
                <span className="block text-xs">Local time zone {event.timeZone}</span>
              ) : null}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {event.locationName ?? DELIVERY_LABEL[event.deliveryMode] ?? "—"}
              {event.locationName && event.deliveryMode !== "in_person" ? (
                <span className="block text-xs">
                  {DELIVERY_LABEL[event.deliveryMode] ?? event.deliveryMode}
                </span>
              ) : null}
            </TableCell>
            <TableCell className="text-sm">
              <LinkedInstances instances={instances} />
            </TableCell>
            <TableCell>
              <StatusBadge status={event.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
