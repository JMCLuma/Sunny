import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { IsoDateTime, Task } from "../../domain";
import { formatDate, formatLabel } from "../../format";
import { EmptyState } from "../empty-state";
import { OperationsSection } from "../operations-section";
import { StatusBadge } from "../status-badge";

function isOverdue(task: Task, referenceDate: IsoDateTime): boolean {
  return task.dueDate !== null && task.dueDate < referenceDate.slice(0, 10);
}

export function AttentionSection({
  tasks,
  referenceDate,
}: {
  tasks: readonly Task[];
  referenceDate: IsoDateTime;
}) {
  return (
    <OperationsSection
      id="attention"
      title="Needs attention"
      description="Open work across every module, most urgent first."
    >
      {tasks.length === 0 ? (
        <EmptyState message="Nothing is waiting on a decision right now." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Item</TableHead>
              <TableHead scope="col">Module</TableHead>
              <TableHead scope="col">Priority</TableHead>
              <TableHead scope="col">Due</TableHead>
              <TableHead scope="col">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell className="text-muted-foreground">{formatLabel(task.module)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatLabel(task.priority)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span
                    className={
                      isOverdue(task, referenceDate)
                        ? "font-medium text-destructive"
                        : "text-muted-foreground"
                    }
                  >
                    {formatDate(task.dueDate)}
                    {isOverdue(task, referenceDate) ? " (overdue)" : ""}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={task.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </OperationsSection>
  );
}
