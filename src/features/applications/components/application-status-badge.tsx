import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/features/operations/domain";

import { presentStatus, type StatusPresentation } from "../view-models";

/** Maps the applicant's own vocabulary (`presentStatus`) onto the shared Badge. */
const VARIANT_BY_TONE: Readonly<
  Record<StatusPresentation["tone"], "default" | "secondary" | "destructive" | "outline">
> = {
  neutral: "outline",
  progress: "secondary",
  good: "default",
  warning: "outline",
  closed: "outline",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const presentation = presentStatus(status);
  return <Badge variant={VARIANT_BY_TONE[presentation.tone]}>{presentation.label}</Badge>;
}
