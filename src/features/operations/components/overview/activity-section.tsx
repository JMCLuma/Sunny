import type { AuditEvent } from "../../domain";
import { formatDateTime, formatLabel } from "../../format";
import { EmptyState } from "../empty-state";
import { OperationsSection } from "../operations-section";

export function ActivitySection({ events }: { events: readonly AuditEvent[] }) {
  return (
    <OperationsSection
      id="recent-activity"
      title="Recent activity"
      description="The audit trail records what changed and who changed it, never the values."
    >
      {events.length === 0 ? (
        <EmptyState message="No activity has been recorded yet." />
      ) : (
        <ol className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
              <p className="text-sm text-foreground">{event.summary}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatLabel(event.action)} · {event.actorLabel} ·{" "}
                {formatDateTime(event.occurredAt)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </OperationsSection>
  );
}
