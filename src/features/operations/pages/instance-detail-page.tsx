import type { ProgramInstanceDetail } from "../data";
import { OperationsSection } from "../components/operations-section";
import { StatusBadge } from "../components/status-badge";
import { EventTable, ReadinessSignals } from "../components/programs";
import { formatAgeRange, formatDateRange, formatLabel } from "../format";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}

/**
 * One delivery of a program.
 *
 * Deliberately absent: rosters, people, payments, contracts, health or
 * screening information, incident detail, uploads, and administrative
 * controls. This is a planning view over non-confidential facts.
 */
export function InstanceDetailPage({ detail }: { detail: ProgramInstanceDetail }) {
  const { instance, program, region } = detail;

  return (
    <div className="space-y-6">
      <OperationsSection
        id="instance-overview"
        title="Session details"
        description={`Part of ${program.name}.`}
        action={<StatusBadge status={instance.status} />}
      >
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Program">{program.name}</Field>
          <Field label="Cycle year">
            <span className="tabular-nums">{instance.cycleYear}</span>
          </Field>
          <Field label="Region">{region?.name ?? "Not assigned"}</Field>
          <Field label="Delivery">{formatLabel(instance.instanceType)}</Field>
          <Field label="Dates">
            {formatDateRange(instance.startDate, instance.endDate)}
            <span className="ml-1 text-xs text-muted-foreground">
              {instance.startDate === null
                ? ""
                : instance.datesConfirmed
                  ? "(confirmed)"
                  : "(tentative)"}
            </span>
          </Field>
          <Field label="Location">{instance.locationName ?? "To be confirmed"}</Field>
          <Field label="Participant ages">{formatAgeRange(instance.ageRange)}</Field>
          <Field label="Planned capacity">
            <span className="tabular-nums">{instance.plannedCapacity}</span>
          </Field>
        </dl>
      </OperationsSection>

      <OperationsSection
        id="instance-events"
        title="Linked events"
        description="Events supporting this session. A shared event appears here and on every other session it serves."
      >
        <EventTable
          rows={detail.events}
          showProgram={false}
          emptyMessage="No events are linked to this session."
        />
      </OperationsSection>

      <OperationsSection
        id="instance-readiness"
        title="Operational readiness"
        description="How each planning area is tracking. Summary only — no contracts, figures or personal records."
      >
        <ReadinessSignals signals={detail.readiness} />
      </OperationsSection>
    </div>
  );
}
