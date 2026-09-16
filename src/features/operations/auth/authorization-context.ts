import { createContext, useContext } from "react";

import type { AuthorizationService } from "./types";

/**
 * React access to the same service the routes use.
 *
 * The service is created once and passed through router context; this context
 * only re-exposes it to components so they never reach for the mock actor.
 */
export const AuthorizationContext = createContext<AuthorizationService | null>(null);

export function useAuthorization(): AuthorizationService {
  const authorization = useContext(AuthorizationContext);
  if (!authorization) {
    throw new Error(
      "useAuthorization must be used inside <AuthorizationProvider>. The Operations layout route provides it.",
    );
  }
  return authorization;
}
