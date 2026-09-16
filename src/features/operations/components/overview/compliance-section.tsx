import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ComplianceReadinessRow } from "../../data";
import { formatLabel } from "../../format";
import { EmptyState } from "../empty-state";
import { OperationsSection } from "../operations-section";

function percentComplete(row: ComplianceReadinessRow): string {
  if (row.assigned === 0) return "—";
  return `${Math.round((row.complete / row.assigned) * 100)}%`;
}

export function ComplianceSection({ rows }: { rows: readonly ComplianceReadinessRow[] }) {
  return (
    <OperationsSection
      id="compliance-readiness"
      title="Compliance readiness"
      description="Counts only. Individual records stay inside the Compliance module."
    >
      {rows.length === 0 ? (
        <EmptyState message="No active requirements are defined yet." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Requirement</TableHead>
              <TableHead scope="col">Category</TableHead>
              <TableHead scope="col" className="text-right">
                Assigned
              </TableHead>
              <TableHead scope="col" className="text-right">
                Complete
              </TableHead>
              <TableHead scope="col" className="text-right">
                Outstanding
              </TableHead>
              <TableHead scope="col" className="text-right">
                Expiring soon
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.requirementId}>
                <TableCell className="font-medium">{row.requirementName}</TableCell>
                <TableCell className="text-muted-foreground">{formatLabel(row.category)}</TableCell>
                <TableCell className="text-right tabular-nums">{row.assigned}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.complete}
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({percentComplete(row)})
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.outstanding}</TableCell>
                <TableCell className="text-right tabular-nums">{row.expiringSoon}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </OperationsSection>
  );
}
