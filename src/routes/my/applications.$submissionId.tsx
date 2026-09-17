import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { ApplicationDetailPage } from "@/features/applications/pages";

/**
 * One application — the wizard while it is a draft, a read-only record after.
 *
 * `getSubmissionDetail` returns everything the wizard needs in one read: the
 * form, the submission, and the profile/account a prefill resolves against.
 * Access is not narrowed here to "this account's own submissions" the way a
 * real backend's row-level security would, because there is no session behind
 * this demo to check against — see `runtime.ts` for where that lands later.
 */
export const Route = createFileRoute("/my/applications/$submissionId")({
  loader: async ({ context, params }) => {
    const { repository } = context.operations;
    const referenceDate = new Date().toISOString();
    const detail = await repository.getSubmissionDetail(params.submissionId);
    if (!detail) throw notFound();
    return { detail, referenceDate };
  },
  component: ApplicationDetailRoute,
});

function ApplicationDetailRoute() {
  const { detail, referenceDate } = Route.useLoaderData();
  const { operations } = Route.useRouteContext();
  const router = useRouter();
  const navigate = Route.useNavigate();
  const [confirming, setConfirming] = useState(false);

  async function handleConfirmPlace() {
    setConfirming(true);
    try {
      await operations.repository.confirmPlace(detail.submission.id);
      await router.invalidate();
    } finally {
      setConfirming(false);
    }
  }

  return (
    <ApplicationDetailPage
      detail={detail}
      referenceDate={referenceDate}
      confirming={confirming}
      onSaveAnswers={(answers, completedSectionIds) =>
        operations.repository.saveAnswers(detail.submission.id, answers, completedSectionIds)
      }
      onSubmitApplication={async () => {
        await operations.repository.submitApplication(detail.submission.id);
        await router.invalidate();
        void navigate({ to: "/my/applications" });
      }}
      onConfirmPlace={() => void handleConfirmPlace()}
    />
  );
}
