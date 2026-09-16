import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

import {
  createProgramAccessPolicy,
  requireAccess,
  toInstanceScopeRef,
} from "@/features/operations/auth";
import { OperationsNotFound, OperationsRouteError } from "@/features/operations/components";
import { getOperationsModule } from "@/features/operations/navigation";

/**
 * Layout for one program.
 *
 * It resolves the program once, guards it once, and contributes the program's
 * breadcrumb — so the detail page and the instance page beneath it neither
 * repeat the check nor rebuild the trail.
 *
 * A program the actor cannot reach is reported as not found rather than as
 * "exists, but hidden": naming a record the actor may not see is itself a
 * disclosure.
 */
export const Route = createFileRoute("/operations/programs/$programId")({
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, getOperationsModule("programs").access);
  },
  loader: async ({ context, params }) => {
    const { authorization, repository } = context.operations;
    const referenceDate = new Date().toISOString();

    const [program, instances] = await Promise.all([
      repository.getProgram(params.programId),
      repository.listProgramInstanceSummaries({ programId: params.programId, referenceDate }),
    ]);
    if (!program) throw notFound();

    const policy = createProgramAccessPolicy(authorization, instances.map(toInstanceScopeRef));
    if (!policy.canViewProgram(program.id)) throw notFound();

    return {
      crumb: {
        label: program.name,
        target: { kind: "program" as const, programId: program.id },
      },
    };
  },
  component: Outlet,
  notFoundComponent: () => (
    <OperationsNotFound
      title="Program not found"
      message="No program matches this address, or it is outside your access."
    />
  ),
  errorComponent: OperationsRouteError,
});
