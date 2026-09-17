import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * The blind / identified switch.
 *
 * Deliberately loud. Blind review only does its job if a reviewer knows, at a
 * glance and without hunting, whether the names in front of them are real —
 * a reviewer who thinks they are blind when they are not is worse off than one
 * who never had the mode at all. So the control states the current mode in
 * words, colours the whole strip when identity is showing, and lives at the top
 * of the screen rather than in a settings menu.
 *
 * The mode is a URL parameter, so a link to a reviewer opens in the same mode
 * the sender was in.
 */
export function BlindModeSwitch({
  identified,
  onChange,
  /** Why identity is being shown here, if the screen has a reason. */
  note,
}: {
  identified: boolean;
  onChange: (identified: boolean) => void;
  note?: string;
}) {
  return (
    <div
      className={
        identified
          ? "rounded-lg border border-destructive bg-destructive/10 p-4"
          : "rounded-lg border border-border bg-card p-4"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          {identified ? (
            <Eye className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          ) : (
            <EyeOff className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          )}
          <div>
            <p className="text-sm font-bold">
              {identified ? "Identified review — names are showing" : "Blind review"}
            </p>
            <p className="text-sm text-muted-foreground">
              {identified
                ? "Scores recorded now are attributed to a reviewer who could see who the applicant was."
                : "Applicants appear as a reference only. Names, households and schools are withheld until a decision is recorded."}
            </p>
            {note ? <p className="mt-1 text-sm text-muted-foreground">{note}</p> : null}
          </div>
        </div>

        <div className="flex gap-2" role="group" aria-label="Reviewer identity mode">
          <Button
            type="button"
            size="sm"
            variant={identified ? "outline" : "default"}
            aria-pressed={!identified}
            onClick={() => onChange(false)}
          >
            Blind
          </Button>
          <Button
            type="button"
            size="sm"
            variant={identified ? "destructive" : "outline"}
            aria-pressed={identified}
            onClick={() => onChange(true)}
          >
            Show names
          </Button>
        </div>
      </div>
    </div>
  );
}
