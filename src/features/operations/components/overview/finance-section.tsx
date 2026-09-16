import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FinanceWorkflowRow } from "../../data";
import { formatCurrency, formatLabel } from "../../format";
import { EmptyState } from "../empty-state";
import { OperationsSection } from "../operations-section";

export function FinanceSection({ rows }: { rows: readonly FinanceWorkflowRow[] }) {
  return (
    <OperationsSection
      id="finance-workflow"
      title="Finance workflow"
      description="Where financial records currently sit in the review chain."
    >
      {rows.length === 0 ? (
        <EmptyState message="No financial records have been raised yet." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Stage</TableHead>
              <TableHead scope="col" className="text-right">
                Records
              </TableHead>
              <TableHead scope="col" className="text-right">
                Value
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.stage}>
                <TableCell className="font-medium">{formatLabel(row.stage)}</TableCell>
                <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(row.totalMinor)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </OperationsSection>
  );
}
