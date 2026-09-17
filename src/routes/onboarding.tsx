import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { OnboardingPage } from "@/features/identity/pages/onboarding-page";
import { parseOnboardingSearch } from "@/features/identity/search";

/**
 * The guided flow between "email verified" and "the household exists".
 *
 * The account itself has no repository write — there is no `createAccount`
 * in the contract — so this loader only reads whichever account the current
 * demo persona already carries, to prefill the basics step. Adding the first
 * profile is real: it goes through `addProfile` and `resolveProfileMatch`
 * for any persona that is signed in to a household. A persona with none
 * (`accountId === null`) still gets to walk the flow — it simply cannot
 * write anywhere, and the page says so.
 */
export const Route = createFileRoute("/onboarding")({
  validateSearch: parseOnboardingSearch,
  loader: async ({ context }) => {
    const { accountId, repository } = context.operations;
    const account = accountId ? await repository.getAccount(accountId) : null;
    return { account };
  },
  component: OnboardingRoute,
});

function OnboardingRoute() {
  const { account } = Route.useLoaderData();
  const { step } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { accountId, repository } = Route.useRouteContext().operations;

  return (
    <OnboardingPage
      step={step ?? 1}
      account={account}
      previewOnly={accountId === null}
      onStepChange={(next) => navigate({ search: { step: next } })}
      onSubmitProfile={async (draft) => {
        if (!accountId) {
          // Nothing to write to — the family portal has no household for
          // this persona, so the outcome is illustrative only.
          return "no_match";
        }
        const profile = await repository.addProfile(accountId, draft);
        return repository.resolveProfileMatch(profile.id);
      }}
      onFinish={() => navigate({ to: "/my" })}
    />
  );
}
