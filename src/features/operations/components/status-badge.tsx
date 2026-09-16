import { Badge } from "@/components/ui/badge";
import { formatLabel } from "../format";

/**
 * One badge for every status vocabulary in the module.
 *
 * The mapping lives here rather than in each page so that "in review" looks
 * the same in finance as it does in compliance. Unlisted statuses fall back to
 * the neutral outline style instead of guessing at a tone.
 */
const TONE_BY_STATUS: Readonly<
  Record<string, "default" | "secondary" | "destructive" | "outline">
> = {
  active: "default",
  connected: "default",
  complete: "default",
  completed: "secondary",
  confirmed: "default",
  posted: "default",
  approved: "default",
  ready: "default",
  in_progress: "secondary",
  applications_open: "secondary",
  planning: "outline",
  planned: "outline",
  inactive: "outline",
  scheduled: "outline",
  draft: "outline",
  not_applicable: "outline",
  not_configured: "outline",
  not_started: "outline",
  submitted: "secondary",
  in_review: "secondary",
  pending: "secondary",
  expiring_soon: "destructive",
  expired: "destructive",
  error: "destructive",
  degraded: "destructive",
  blocked: "destructive",
  needs_attention: "destructive",
  action_required: "destructive",
  cancelled: "outline",
  archived: "outline",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={TONE_BY_STATUS[status] ?? "outline"}>{formatLabel(status)}</Badge>;
}
