import { Sparkles } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * "Confirm, don't retype" as one act per section, not one per field.
 *
 * The 09-09 call's complaint about the draft was eight checkboxes agreeing
 * with eight things the family already told us — so this is the one checkbox
 * `isSectionComplete` actually looks for, sitting above every pre-filled field
 * in the section rather than beside each of them.
 */
export function PrefillConfirmBar({
  confirmed,
  invalid,
  onConfirm,
}: {
  confirmed: boolean;
  invalid?: boolean | undefined;
  onConfirm: (confirmed: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-3 rounded-md border p-3",
        invalid ? "border-destructive bg-destructive/10" : "border-highlight bg-highlight/20",
      )}
    >
      <Checkbox
        id="prefill-confirm"
        checked={confirmed}
        onCheckedChange={(next) => onConfirm(next === true)}
        className="mt-0.5"
        aria-describedby={invalid ? "prefill-confirm-error" : undefined}
      />
      <div className="space-y-1">
        <Label htmlFor="prefill-confirm" className="flex items-center gap-1.5 font-medium">
          <Sparkles aria-hidden className="size-3.5 text-highlight-foreground" />
          We&apos;ve filled this in from the profile.
        </Label>
        <p className="text-sm text-muted-foreground">
          Check it&apos;s still right below, then tick this to confirm.
        </p>
        {invalid ? (
          <p id="prefill-confirm-error" className="text-sm font-medium text-destructive">
            Confirm the pre-filled answers before continuing.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** The tag next to a field that arrived already filled in. */
export function PrefillTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-sm bg-highlight/30 px-1.5 py-0.5 text-xs font-medium text-highlight-foreground">
      <Sparkles aria-hidden className="size-3" />
      From your profile
    </span>
  );
}
