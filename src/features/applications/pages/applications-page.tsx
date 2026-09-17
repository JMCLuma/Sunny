import { ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { PortalEmptyState } from "@/features/portal/components/portal-empty-state";
import { PortalPageHeader } from "@/features/portal/components/portal-page-header";
import type { Id } from "@/features/operations/domain";
import type { SubmissionSummary } from "@/features/operations/data";

import { ApplicationCard } from "../components/application-card";
import { sortApplications } from "../view-models";

/**
 * Every application this household holds, needs-you-first.
 *
 * `sortApplications` is the same function a future dashboard widget would
 * use, so "what needs me" never disagrees between screens — a draft or an
 * unconfirmed offer always sorts above something already settled.
 */
export function ApplicationsPage({
  accountId,
  rows,
  referenceDate,
  confirmingId,
  onConfirmPlace,
}: {
  accountId: Id | null;
  rows: readonly SubmissionSummary[];
  referenceDate: string;
  confirmingId: Id | null;
  onConfirmPlace: (submissionId: Id) => void;
}) {
  if (!accountId) {
    return (
      <div className="space-y-6">
        <PortalPageHeader title="Applications" />
        <PortalEmptyState icon={ClipboardList} title="No household is signed in">
          Applications belong to a family account. Switch to a parent, adult participant or
          staff-applicant persona to see them.
        </PortalEmptyState>
      </div>
    );
  }

  const sorted = sortApplications(rows);

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title="Applications"
        description="Everything your household has applied to, most urgent first."
      />

      {sorted.length === 0 ? (
        <PortalEmptyState
          icon={ClipboardList}
          title="No applications yet"
          action={
            <Button asChild>
              <Link to="/my/apply">Apply to a camp</Link>
            </Button>
          }
        >
          Start one from the camps your household is eligible for.
        </PortalEmptyState>
      ) : (
        <>
          <ul className="space-y-3">
            {sorted.map((row) => (
              <ApplicationCard
                key={row.submission.id}
                row={row}
                referenceDate={referenceDate}
                confirming={confirmingId === row.submission.id}
                onConfirmPlace={() => onConfirmPlace(row.submission.id)}
              />
            ))}
          </ul>
          <Button asChild variant="secondary">
            <Link to="/my/apply">Apply to another camp</Link>
          </Button>
        </>
      )}
    </div>
  );
}
