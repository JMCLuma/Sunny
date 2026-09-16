import type { ReactNode } from "react";

import { AuthorizationContext } from "./authorization-context";
import type { AuthorizationService } from "./types";

export function AuthorizationProvider({
  authorization,
  children,
}: {
  authorization: AuthorizationService;
  children: ReactNode;
}) {
  return (
    <AuthorizationContext.Provider value={authorization}>{children}</AuthorizationContext.Provider>
  );
}
