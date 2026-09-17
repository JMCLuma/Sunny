import { createFileRoute, useRouter } from "@tanstack/react-router";

import { requireAccess } from "@/features/operations/auth";
import { OperationsRouteError } from "@/features/operations/components";
import { getOperationsModule } from "@/features/operations/navigation";
import { PeoplePage } from "@/features/people/pages/people-page";

const MODULE = getOperationsModule("people");

export const Route = createFileRoute("/operations/people")({
  beforeLoad: ({ context }) => {
    requireAccess(context.operations.authorization, MODULE.access);
  },
  loader: async ({ context }) => {
    const { repository, authorization } = context.operations;
    const [directory, reviews] = await Promise.all([
      repository.listPersonDirectory(),
      repository.listMatchReviews(),
    ]);
    return {
      directory,
      reviews,
      // Seeing the queue and resolving it are different permissions: a camp
      // lead may need to know a record is disputed without being the person
      // who decides two families are one.
      canResolve: authorization.can({ resource: "people", action: "manage", scope: "all" }),
    };
  },
  component: People,
  errorComponent: OperationsRouteError,
});

function People() {
  const { directory, reviews, canResolve } = Route.useLoaderData();
  const { repository } = Route.useRouteContext().operations;
  const router = useRouter();

  return (
    <PeoplePage
      directory={directory}
      reviews={reviews}
      canResolve={canResolve}
      onResolve={(reviewId, decision) => {
        void repository.resolveMatchReview(reviewId, decision).then(() => router.invalidate());
      }}
    />
  );
}
