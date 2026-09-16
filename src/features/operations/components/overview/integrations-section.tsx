import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { IntegrationConnection } from "../../domain";
import { formatLabel } from "../../format";
import { EmptyState } from "../empty-state";
import { OperationsSection } from "../operations-section";
import { StatusBadge } from "../status-badge";

export function IntegrationsSection({
  integrations,
}: {
  integrations: readonly IntegrationConnection[];
}) {
  return (
    <OperationsSection
      id="integrations"
      title="Integration status"
      description="Nothing is connected in this phase — this is the intended shape of the estate."
    >
      {integrations.length === 0 ? (
        <EmptyState message="No integrations have been registered yet." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Integration</TableHead>
              <TableHead scope="col">Category</TableHead>
              <TableHead scope="col">Purpose</TableHead>
              <TableHead scope="col">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {integrations.map((integration) => (
              <TableRow key={integration.id}>
                <TableCell className="font-medium">{integration.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatLabel(integration.category)}
                </TableCell>
                <TableCell className="text-muted-foreground">{integration.purpose}</TableCell>
                <TableCell>
                  <StatusBadge status={integration.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </OperationsSection>
  );
}
