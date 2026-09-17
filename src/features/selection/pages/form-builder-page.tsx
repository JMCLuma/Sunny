import { Lock, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState, OperationsSection } from "@/features/operations/components";
import type {
  ApplicationForm,
  ApplicationQuestion,
  ApplicationSection,
} from "@/features/operations/domain";
import { formatDate, formatLabel } from "@/features/operations/format";

/**
 * The form builder — read-mostly, and deliberately so.
 *
 * The point this screen has to make is structural: the camp-specific section
 * is one section appended to a shared form, owned by one program, changeable
 * year to year without anyone touching the universal sections underneath it.
 * `builder.tsx`'s job is to show that boundary clearly; actually editing
 * questions is presentational here, same as the export button on the queue —
 * the affordance exists so the shape is legible, the write isn't wired.
 */
export function FormBuilderPage({
  form,
  campSection,
  campQuestions,
  programName,
  canManage,
}: {
  form: ApplicationForm;
  campSection: ApplicationSection;
  campQuestions: readonly ApplicationQuestion[];
  programName: string;
  canManage: boolean;
}) {
  const sharedSections = form.sections.filter((section) => section.id !== campSection.id);

  return (
    <div className="space-y-6">
      <OperationsSection
        id="builder-shared"
        title="Shared sections"
        description="Universal across every camp. A camp team cannot edit these from here."
      >
        <ul className="space-y-2">
          {sharedSections.map((section) => (
            <li
              key={section.id}
              className="flex items-center gap-2 rounded-md border border-border p-3"
            >
              <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">{section.title}</p>
                {section.description ? (
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                ) : null}
              </div>
              <Badge variant="outline" className="ms-auto">
                {form.questions.filter((question) => question.sectionId === section.id).length}{" "}
                questions
              </Badge>
            </li>
          ))}
        </ul>
      </OperationsSection>

      <OperationsSection
        id="builder-camp"
        title={campSection.title}
        description={`Maintained by the ${programName} team — changes here never touch the shared sections above.`}
        action={<ManageButton enabled={canManage} />}
      >
        <p className="mb-4 text-sm text-muted-foreground">
          {form.title} · form version {form.version} ·{" "}
          {form.status === "published" ? "accepting responses" : formatLabel(form.status)}
          {form.deadline ? ` · closes ${formatDate(form.deadline)}` : ""}
        </p>

        {campQuestions.length === 0 ? (
          <EmptyState message="This camp has not added any questions to its section yet." />
        ) : (
          <ol className="space-y-3">
            {campQuestions.map((question, index) => (
              <li key={question.id} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium">
                    {index + 1}. {question.label}
                  </p>
                  <div className="flex gap-1.5">
                    <Badge variant="outline">{formatLabel(question.type)}</Badge>
                    {question.required ? <Badge variant="secondary">Required</Badge> : null}
                  </div>
                </div>
                {question.helpText ? (
                  <p className="mt-1 text-xs text-muted-foreground">{question.helpText}</p>
                ) : null}
                {question.maxLength ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Up to {question.maxLength} characters.
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </OperationsSection>
    </div>
  );
}

function ManageButton({ enabled }: { enabled: boolean }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button type="button" size="sm" variant="outline" disabled={!enabled}>
              <Plus className="me-2 size-4" aria-hidden="true" />
              Add question
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {enabled
            ? "Not wired in this demo — the builder is read-only."
            : "Only this camp's team can edit its section."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
