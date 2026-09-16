import type { ProgramDetail } from "../data";
import { OperationsSection } from "../components/operations-section";
import { StatusBadge } from "../components/status-badge";
import { EventTable, InstanceTable, ReadinessRollup } from "../components/programs";
import { formatLabel } from "../format";

/**
 * One program: what it is, which deliveries are live, what is coming, and how
 * ready they are. Read-only by design — there are no edit, archive, duplicate
 * or delete controls in this phase, and a disabled one would be worse than
 * none.
 */
export function ProgramDetailPage({ detail }: { detail: ProgramDetail }) {
  const { program } = detail;

  return (
    <div className="space-y-6">
      <OperationsSection
        id="program-overview"
        title="About this program"
        action={<StatusBadge status={program.status} />}
      >
        <p className="max-w-3xl text-sm text-foreground">{program.summary}</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Audience
            </dt>
            <dd className="mt-0.5 text-sm">{formatLabel(program.audience)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sessions in flight
            </dt>
            <dd className="mt-0.5 text-sm tabular-nums">
              {detail.current.length + detail.upcoming.length}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Completed sessions
            </dt>
            <dd className="mt-0.5 text-sm tabular-nums">{detail.completed.length}</dd>
          </div>
        </dl>
      </OperationsSection>

      <OperationsSection
        id="program-current"
        title="Running now"
        description="Sessions currently under way."
      >
        <InstanceTable
          rows={detail.current}
          emptyMessage="No sessions of this program are running right now."
        />
      </OperationsSection>

      <OperationsSection
        id="program-upcoming"
        title="Planned and upcoming"
        description="Sessions that have not started, soonest first. Undecided dates sort last."
      >
        <InstanceTable
          rows={detail.upcoming}
          emptyMessage="Nothing is planned for this program yet."
        />
      </OperationsSection>

      {detail.completed.length > 0 ? (
        <OperationsSection
          id="program-completed"
          title="Completed and cancelled"
          description="Most recent first."
        >
          <InstanceTable rows={detail.completed} emptyMessage="No history yet." />
        </OperationsSection>
      ) : null}

      <OperationsSection
        id="program-events"
        title="Upcoming events"
        description="Training, meetings and gatherings still to come for this program."
      >
        <EventTable
          rows={detail.upcomingEvents}
          showProgram={false}
          emptyMessage="No events are scheduled for this program."
        />
      </OperationsSection>

      <OperationsSection
        id="program-readiness"
        title="Operational readiness"
        description="Counts across this program's sessions. Finance, Compliance, Vendors and People remain the systems of record."
      >
        <ReadinessRollup rows={detail.readiness} />
      </OperationsSection>
    </div>
  );
}
