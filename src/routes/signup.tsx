import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { SignupPage } from "@/features/identity/pages/signup-page";

/**
 * Account creation. No loader: nothing here depends on a signed-in persona,
 * and the actual account is never written to a repository — there is no
 * `createAccount` in the contract, because the wireframe demonstrates what an
 * account gives you, not a working auth backend. Submitting only moves the
 * demo forward to the verification step it would trigger for real.
 */
export const Route = createFileRoute("/signup")({
  component: SignupRoute,
});

function SignupRoute() {
  const navigate = useNavigate();

  return (
    <SignupPage
      onSubmitted={(email) => {
        navigate({
          to: "/verify-email",
          search: { state: "pending", ...(email.trim() ? { email: email.trim() } : {}) },
        });
      }}
    />
  );
}
