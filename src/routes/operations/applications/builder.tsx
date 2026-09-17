import { createFileRoute, notFound } from "@tanstack/react-router";

import { OperationsNotFound, OperationsRouteError } from "@/features/operations/components";
import { createApplicationAccessPolicy } from "@/features/selection/access";
import { toApplicationScopeRef } from "@/features/selection/application-scope";
import { FormBuilderPage } from "@/features/selection/pages";

/** The one universal participant form this wireframe seeds. */
const PARTICIPANT_FORM_ID = "form_participant_2026";

/**
 * The form builder — read-mostly, and scoped to the camp-specific section a
 * program's team owns.
 *
 * The point is structural, not editorial: this section is appended to a
 * shared form and can change year to year without anyone touching the
 * universal sections. Access follows the section's owning program, the same
 * `applications` policy every other screen in the module uses, so a camp lead
 * for a different program cannot open another camp's questions by guessing
 * the form id.
 */
export const Route = createFileRoute("/operations/applications/builder")({
  loader: async ({ context }) => {
    const { authorization, repository } = context.operations;

    const form = await repository.getApplicationForm(PARTICIPANT_FORM_ID);
    if (!form) throw notFound();

    const campSection = form.sections.find((section) => section.kind === "camp_specific");
    if (!campSection || campSection.ownedByProgramId === null) throw notFound();

    const allInstances = await repository.listProgramInstances();
    const policy = createApplicationAccessPolicy(
      authorization,
      allInstances.map(toApplicationScopeRef),
    );
    if (!policy.canViewInstance(form.programInstanceId)) throw notFound();

    const program = await repository.getProgram(campSection.ownedByProgramId);

    return {
      form,
      campSection,
      campQuestions: form.questions
        .filter((question) => question.sectionId === campSection.id)
        .slice()
        .sort((a, b) => a.order - b.order),
      programName: program?.name ?? "Unknown program",
      canManage: policy.canDecideInstance(form.programInstanceId),
    };
  },
  component: FormBuilderRoute,
  notFoundComponent: () => (
    <OperationsNotFound
      title="Form not found"
      message="No application form matches this address, or it is outside your access."
    />
  ),
  errorComponent: OperationsRouteError,
});

function FormBuilderRoute() {
  const { form, campSection, campQuestions, programName, canManage } = Route.useLoaderData();

  return (
    <FormBuilderPage
      form={form}
      campSection={campSection}
      campQuestions={campQuestions}
      programName={programName}
      canManage={canManage}
    />
  );
}
