import { getPersona } from "@/features/demo/personas";

import { createAuthorizationService, type AuthorizationService } from "./auth";
import { createMockOperationsRepository, type OperationsRepository } from "./data";

/**
 * Composition root for the Operations module.
 *
 * This is the one place that knows which implementations are in use. The
 * runtime is built in `src/router.tsx` and reaches routes through router
 * context, so no route, page or component ever imports the mock actor or the
 * mock repository. TanStack Start builds a router per request, so a runtime is
 * never shared between server-rendered requests.
 *
 * ## Where Supabase plugs in
 *
 * 1. **Authentication** — replace `DEMO_ADMINISTRATOR` with an actor built
 *    from the Supabase session: resolve `auth.users.id` to a `Person` through
 *    `UserAccountReference`, then load that person's grants. Because the
 *    runtime is built with the router rather than cached at module scope, a
 *    server render never reuses another request's actor.
 * 2. **Authorization** — `createAuthorizationService` keeps its signature; only
 *    the grants change from a constant to rows read from the permissions
 *    tables. Client-side checks stay exactly as they are: they decide what to
 *    render and which routes to allow.
 * 3. **Row Level Security** — the real enforcement boundary. Every Operations
 *    table gets policies keyed off the same scopes this module already models
 *    (`all`, `region`, `program`, `assigned_program`, `self`), so a request
 *    that slips past a client check still returns no rows.
 * 4. **Data** — swap `createMockOperationsRepository()` for a Supabase-backed
 *    implementation of the same `OperationsRepository` interface. No page
 *    component changes.
 */
export interface OperationsRuntime {
  readonly authorization: AuthorizationService;
  readonly repository: OperationsRepository;
  /** Which demo persona built this actor. Chrome reads it; logic must not. */
  readonly personaId: string;
  /** The household a family persona is signed in to; null for staff personas. */
  readonly accountId: string | null;
}

/**
 * `personaId` stands in for "who is signed in". It comes from a cookie read
 * per request, which is why the runtime is still built per navigation and
 * never cached at module scope — exactly where a Supabase session will slot in.
 */
export function createOperationsRuntime(personaId?: string | null): OperationsRuntime {
  const persona = getPersona(personaId);
  return {
    authorization: createAuthorizationService(persona.actor),
    repository: createMockOperationsRepository(),
    personaId: persona.id,
    accountId: persona.accountId,
  };
}
