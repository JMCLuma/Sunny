import { Link } from "@tanstack/react-router";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProgramPortfolioRow } from "../../data";
import { formatLabel } from "../../format";
import { EmptyState } from "../empty-state";
import { OperationsSection } from "../operations-section";

export function PortfolioSection({ rows }: { rows: readonly ProgramPortfolioRow[] }) {
  return (
    <OperationsSection
      id="portfolio"
      title="Program portfolio"
      description="Every active program, with the sessions and people currently attached to it."
    >
      {rows.length === 0 ? (
        <EmptyState message="No active programs yet. Programs added in the Programs module appear here." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Program</TableHead>
              <TableHead scope="col">Audience</TableHead>
              <TableHead scope="col" className="text-right">
                Active sessions
              </TableHead>
              <TableHead scope="col" className="text-right">
                Upcoming
              </TableHead>
              <TableHead scope="col" className="text-right">
                People assigned
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.program.id}>
                <TableCell className="font-medium">
                  <Link
                    to="/operations/programs/$programId"
                    params={{ programId: row.program.id }}
                    className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {row.program.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatLabel(row.program.audience)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.activeInstances}</TableCell>
                <TableCell className="text-right tabular-nums">{row.upcomingInstances}</TableCell>
                <TableCell className="text-right tabular-nums">{row.assignedPeople}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </OperationsSection>
  );
}
