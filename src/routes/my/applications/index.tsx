import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { ApplicationsPage } from "@/features/applications/pages";
import type { Id } from "@/features/operations/domain";

/**
 * Every application this household holds.
 *
 * `confirmPlace` mutates through the repository and the loader re-runs to
 * pick up the new status — the same round trip `/my/apply` uses to turn a
 * selection into a draft.
 */
export const Route = createFileRoute("/my/applications/")({
  loader: async ({ context }) => {
    const { repository, accountId } = context.operations;
    const referenceDate = new Date().toISOString();
    const rows = accountId ? await repository.listSubmissionsForAccount(accountId) : [];
    return { accountId, rows, referenceDate };
  },
  component: ApplicationsRoute,
});

function ApplicationsRoute() {
  const { accountId, rows, referenceDate } = Route.useLoaderData();
  const { operations } = Route.useRouteContext();
  const router = useRouter();
  const [confirmingId, setConfirmingId] = useState<Id | null>(null);

  async function handleConfirmPlace(submissionId: Id) {
    setConfirmingId(submissionId);
    try {
      await operations.repository.confirmPlace(submissionId);
      await router.invalidate();
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <ApplicationsPage
      accountId={accountId}
      rows={rows}
      referenceDate={referenceDate}
      confirmingId={confirmingId}
      onConfirmPlace={(submissionId) => void handleConfirmPlace(submissionId)}
    />
  );
}
