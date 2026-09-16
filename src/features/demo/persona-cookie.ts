import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

import { readPersonaId } from "./current-persona";
import { DEFAULT_PERSONA_ID, type PersonaId } from "./personas";

/**
 * The active persona, resolved on whichever side is asking.
 *
 * `createIsomorphicFn` compiles the server branch — and the import it uses —
 * out of the client bundle, which is what keeps `getCookie` from tripping the
 * bundler's import protection. It must be a static import: `require` is not
 * defined in this ESM context, so a dynamic one throws and every request
 * silently falls back to the default persona.
 */
export const resolvePersonaId = createIsomorphicFn()
  .client((): PersonaId => readPersonaId())
  .server((): PersonaId => {
    try {
      return readPersonaId(getCookie);
    } catch {
      // No request in scope (prerender, warm-up render): default rather than fail.
      return DEFAULT_PERSONA_ID;
    }
  });
