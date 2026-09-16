import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProgramReadinessRollupRow } from "../../data";
import type { ReadinessSignal } from "../../domain";
import { formatDate, formatLabel } from "../../format";
import { EmptyState } from "../empty-state";
import { StatusBadge } from "../status-badge";

/**
 * Per-area readiness for one instance. A planning aid: each line says how an
 * area is tracking and nothing more — no contracts, figures or people.
 */
export function ReadinessSignals({ signals }: { signals: readonly ReadinessSignal[] }) {
  if (signals.length === 0) {
    return <EmptyState message="No readiness areas are being tracked for this session yet." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Area</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Note</TableHead>
          <TableHead scope="col">Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {signals.map((signal) => (
          <TableRow key={signal.id}>
            <TableCell className="font-medium">{formatLabel(signal.area)}</TableCell>
            <TableCell>
              <StatusBadge status={signal.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">{signal.note ?? "—"}</TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formatDate(signal.updatedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Readiness across a program's instances, counted by area. */
export function ReadinessRollup({ rows }: { rows: readonly ProgramReadinessRollupRow[] }) {
  if (rows.length === 0) {
    return <EmptyState message="Readiness is tracked once a session has sessions to plan." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Area</TableHead>
          <TableHead scope="col" className="text-right">
            Ready
          </TableHead>
          <TableHead scope="col" className="text-right">
            In progress
          </TableHead>
          <TableHead scope="col" className="text-right">
            Not started
          </TableHead>
          <TableHead scope="col" className="text-right">
            Needs attention
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.area}>
            <TableCell className="font-medium">{formatLabel(row.area)}</TableCell>
            <TableCell className="text-right tabular-nums">{row.counts.ready}</TableCell>
            <TableCell className="text-right tabular-nums">{row.counts.in_progress}</TableCell>
            <TableCell className="text-right tabular-nums">{row.counts.not_started}</TableCell>
            <TableCell className="text-right tabular-nums">
              {row.counts.needs_attention > 0 ? (
                <span className="font-medium text-destructive">{row.counts.needs_attention}</span>
              ) : (
                row.counts.needs_attention
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
