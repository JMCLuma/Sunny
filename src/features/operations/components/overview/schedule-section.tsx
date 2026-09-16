import { Link } from "@tanstack/react-router";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UpcomingEventRow, UpcomingInstanceRow } from "../../data";
import { formatDateRange, formatDateTime, formatLabel } from "../../format";
import { EmptyState } from "../empty-state";
import { OperationsSection } from "../operations-section";
import { StatusBadge } from "../status-badge";

export function UpcomingInstancesSection({ rows }: { rows: readonly UpcomingInstanceRow[] }) {
  return (
    <OperationsSection
      id="upcoming-instances"
      title="Upcoming program sessions"
      description="Sessions that have not started yet, in date order."
    >
      {rows.length === 0 ? (
        <EmptyState message="No sessions are scheduled ahead of today." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Session</TableHead>
              <TableHead scope="col">Program</TableHead>
              <TableHead scope="col">Dates</TableHead>
              <TableHead scope="col">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ instance, programName }) => (
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
                <TableCell className="text-muted-foreground">{programName}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateRange(instance.startDate, instance.endDate)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={instance.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </OperationsSection>
  );
}

export function UpcomingEventsSection({ rows }: { rows: readonly UpcomingEventRow[] }) {
  return (
    <OperationsSection
      id="upcoming-events"
      title="Training and events"
      description="Training, orientations, staff camps and meetings still to come."
      action={
        <Link
          to="/operations/programs/events"
          className="text-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Full schedule
        </Link>
      }
    >
      {rows.length === 0 ? (
        <EmptyState message="No training or events are scheduled ahead of today." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Event</TableHead>
              <TableHead scope="col">Type</TableHead>
              <TableHead scope="col">Program</TableHead>
              <TableHead scope="col">Starts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ event, programName }) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatLabel(event.eventType)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {programName ?? "All programs"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(event.startsAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </OperationsSection>
  );
}
