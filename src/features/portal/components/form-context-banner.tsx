import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import type { ChecklistEntryLocation } from "../checklist-view";

/**
 * "You're doing this for Demo P. at Mosaic" — the line every form page needs
 * and none of them should have to work out on their own.
 *
 * A family can reach `/my/health` from a checklist item, but also directly
 * from the nav, and the second case has no camp to name. `location` is
 * `null` in exactly that case, and the banner says so rather than guessing.
 */
export function FormContextBanner({ location }: { location: ChecklistEntryLocation | null }) {
  if (!location) {
    return (
      <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Not linked to a specific camp checklist right now — open it from{" "}
        <Link to="/my/programs" className="underline underline-offset-2">
          My camps
        </Link>{" "}
        to have it check itself off there too.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-secondary px-3 py-2 text-sm text-secondary-foreground">
      <span className="min-w-0 truncate">
        For <strong>{location.view.profileName}</strong> at {location.view.programName}
      </span>
      <Link
        to="/my/programs/$instanceId"
        params={{ instanceId: location.view.programInstanceId }}
        search={{ profile: location.view.profileId }}
        className="flex shrink-0 items-center gap-0.5 text-xs font-medium underline-offset-2 hover:underline"
      >
        Back to checklist
        <ChevronRight aria-hidden className="size-3.5 rtl:rotate-180" />
      </Link>
    </div>
  );
}
