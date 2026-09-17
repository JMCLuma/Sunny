import { createFileRoute } from "@tanstack/react-router";

import { parseVerifySearch } from "@/features/identity/search";
import { VerifyEmailPage } from "@/features/identity/pages/verify-email-page";

/**
 * Email verification. `state` and `email` live in the URL because the real
 * version of this page is the landing target of a mailed link — the state
 * has to survive a full page load with no client state behind it.
 *
 * Resending has nothing to send to in a wireframe with no mail server, so
 * `onResend` is a deliberate no-op — the button is real, the email is not.
 */
export const Route = createFileRoute("/verify-email")({
  validateSearch: parseVerifySearch,
  component: VerifyEmailRoute,
});

function VerifyEmailRoute() {
  const { state, email } = Route.useSearch();

  return <VerifyEmailPage state={state} email={email ?? null} onResend={() => {}} />;
}
