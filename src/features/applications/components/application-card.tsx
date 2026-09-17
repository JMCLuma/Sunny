import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { SubmissionSummary } from "@/features/operations/data";

import { presentStatus } from "../view-models";
import { AcceptedOfferPanel } from "./accepted-offer-panel";
import { ApplicationStatusBadge } from "./application-status-badge";
import { BackgroundCheckNotice } from "./background-check-notice";

/**
 * One application, as the household sees it.
 *
 * The card decides what to show, not just how to show it: a draft gets a
 * resume link and a completion bar, an offer gets a countdown and a confirm
 * button, and a staff acceptance gets the background-check explanation on top
 * of all of that — because the two gates (confirm-by, and cleared-to-onboard)
 * are independent and a family holding both needs to see both.
 */
export function ApplicationCard({
  row,
  referenceDate,
  confirming,
  onConfirmPlace,
}: {
  row: SubmissionSummary;
  referenceDate: string;
  confirming: boolean;
  onConfirmPlace: () => void;
}) {
  const { submission } = row;
  const presentation = presentStatus(submission.status);

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold">{row.profileName}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {row.programName} · {row.instanceName}
          </p>
        </div>
        <ApplicationStatusBadge status={submission.status} />
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{presentation.summary}</p>

      {submission.status === "draft" ? (
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              <span className="tabular-nums">{Math.round(row.completion * 100)}%</span> complete
            </p>
            <Progress value={Math.round(row.completion * 100)} aria-hidden className="h-2" />
          </div>
          <Button asChild>
            <Link to="/my/applications/$submissionId" params={{ submissionId: submission.id }}>
              Resume application
            </Link>
          </Button>
        </div>
      ) : null}

      {submission.status === "accepted" ? (
        <div className="mt-3 space-y-3">
          <AcceptedOfferPanel
            confirmByDate={submission.confirmByDate}
            referenceDate={referenceDate}
            confirming={confirming}
            onConfirm={onConfirmPlace}
          />
          {submission.backgroundCheckRequired && submission.backgroundCheckStatus ? (
            <BackgroundCheckNotice status={submission.backgroundCheckStatus} />
          ) : null}
        </div>
      ) : null}

      {submission.status !== "draft" ? (
        <Button asChild variant="secondary" className="mt-3">
          <Link to="/my/applications/$submissionId" params={{ submissionId: submission.id }}>
            View application
          </Link>
        </Button>
      ) : null}
    </li>
  );
}
