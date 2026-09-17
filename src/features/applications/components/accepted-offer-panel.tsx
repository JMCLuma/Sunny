import { Button } from "@/components/ui/button";
import { PortalNotice } from "@/features/portal/components/portal-notice";
import { formatDate } from "@/features/operations/format";
import type { IsoDate } from "@/features/operations/domain";

import { daysUntil, isPastDue } from "../view-models";

/**
 * An acceptance is a deadline, not a badge.
 *
 * `confirmByDate` is what the repository comment on `ApplicationSubmission`
 * calls out as the consequential one: miss it and the place is meant to move
 * back to the waitlist automatically. The mock repository does not run that
 * transition on a clock nobody controls in a demo, so this panel says the
 * rule plainly instead of pretending the countdown is cosmetic.
 */
export function AcceptedOfferPanel({
  confirmByDate,
  referenceDate,
  confirming,
  onConfirm,
}: {
  confirmByDate: IsoDate | null;
  referenceDate: string;
  confirming: boolean;
  onConfirm: () => void;
}) {
  if (!confirmByDate) {
    return (
      <PortalNotice tone="caution" title="No confirm-by date on file">
        Contact your camp team — an acceptance should always carry a date to confirm by.
      </PortalNotice>
    );
  }

  const overdue = isPastDue(referenceDate, confirmByDate);
  const remaining = daysUntil(referenceDate, confirmByDate);

  return (
    <div className="space-y-3">
      <PortalNotice
        tone={overdue ? "caution" : "info"}
        title={overdue ? "This date has passed" : `Confirm by ${formatDate(confirmByDate)}`}
      >
        {overdue
          ? "An offer not confirmed by its date is automatically returned to the waitlist. Contact your camp team."
          : `${remaining === 0 ? "Today" : `${remaining} day${remaining === 1 ? "" : "s"} left`}. If you don't confirm by this date, this offer is automatically returned to the waitlist.`}
      </PortalNotice>
      <Button onClick={onConfirm} disabled={overdue || confirming}>
        {confirming ? "Confirming…" : "Confirm your place"}
      </Button>
    </div>
  );
}
