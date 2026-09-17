import { PortalNotice } from "@/features/portal/components/portal-notice";
import type { BackgroundCheckStatus } from "@/features/operations/domain";

import { presentBackgroundCheckStatus } from "../view-models";

/**
 * The gate, explained — and nothing the check actually found.
 *
 * `ApplicationSubmission.backgroundCheckStatus` deliberately carries no
 * findings or report text (see the domain comment on `BackgroundCheckStatus`),
 * so there is nothing more to show here even for a camp lead reading this same
 * component; a staff applicant sees exactly what Operations would.
 */
export function BackgroundCheckNotice({
  status,
  className,
}: {
  status: BackgroundCheckStatus;
  className?: string | undefined;
}) {
  const cleared = status === "cleared";
  return (
    <PortalNotice
      tone={cleared ? "info" : "privacy"}
      title="Background check required to onboard"
      {...(className ? { className } : {})}
    >
      This role cannot be onboarded until a background check clears. We show its status here, never
      its findings.{" "}
      <span className="font-semibold text-foreground">{presentBackgroundCheckStatus(status)}</span>.
    </PortalNotice>
  );
}
