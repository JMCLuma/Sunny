import { Check } from "lucide-react";

import type { ApplicationSection, Id } from "@/features/operations/domain";
import { cn } from "@/lib/utils";

/**
 * The progress bar the 09-09 call asked for by name: one segment per section,
 * turning solid as that section is completed rather than one bar creeping up
 * by fractions nobody can attach to a step.
 *
 * A step is clickable at any time — `useApplicationWizard.goToStep` saves
 * whatever is typed and refuses nothing, so jumping ahead or back here always
 * lands somewhere real rather than a preview of a page that is not there yet.
 */
export function WizardStepper({
  sections,
  currentIndex,
  completedSectionIds,
  onStepClick,
}: {
  sections: readonly ApplicationSection[];
  currentIndex: number;
  completedSectionIds: ReadonlySet<Id>;
  onStepClick: (index: number) => void;
}) {
  return (
    <ol aria-label="Application steps" className="grid grid-cols-3 gap-2">
      {sections.map((section, index) => {
        const done = completedSectionIds.has(section.id);
        const current = index === currentIndex;

        return (
          <li key={section.id}>
            <button
              type="button"
              onClick={() => onStepClick(index)}
              aria-current={current ? "step" : undefined}
              className="w-full text-start"
            >
              <span
                aria-hidden
                className={cn(
                  "block h-1.5 rounded-full transition-colors",
                  done ? "bg-primary" : current ? "bg-highlight" : "bg-muted",
                )}
              />
              <span
                className={cn(
                  "mt-1.5 flex items-center gap-1 text-xs font-medium",
                  current ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {done ? (
                  <Check aria-hidden className="size-3.5 shrink-0 text-primary" />
                ) : (
                  <span aria-hidden className="shrink-0 tabular-nums">
                    {index + 1}.
                  </span>
                )}
                <span className="truncate">{section.title}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
