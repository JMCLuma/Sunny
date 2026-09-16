import { DEFAULT_PERSONA_ID, isPersonaId, type PersonaId } from "./personas";

/**
 * Reading and writing the active demo persona.
 *
 * A cookie rather than React state, for one reason: route guards run in
 * `beforeLoad`, on the server during SSR and again on client navigation. A
 * persona held only in a component tree would be invisible to them, and the
 * demo's whole point is that switching persona changes what the *guards* do,
 * not just what the chrome draws.
 *
 * Switching therefore reloads the page. That is a deliberate trade: a reload
 * costs a presenter half a second and guarantees the server and the client
 * agree about who is signed in, which matters more here than smoothness.
 */

export const PERSONA_COOKIE = "luma_demo_persona";

/** A year: personas are presentation state, and losing one mid-demo is annoying. */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function parse(value: string | undefined | null): PersonaId {
  return value && isPersonaId(value) ? value : DEFAULT_PERSONA_ID;
}

function readFromDocument(): PersonaId {
  if (typeof document === "undefined") return DEFAULT_PERSONA_ID;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${PERSONA_COOKIE}=([^;]*)`));
  return parse(match?.[1] ? decodeURIComponent(match[1]) : null);
}

/**
 * The active persona, on either side of the render.
 *
 * Server-side this reaches for the request cookie; the import is dynamic and
 * guarded because the helper only exists inside a request, and a demo must
 * never fail to render because nobody has chosen a persona yet. Any failure
 * falls back to the default rather than throwing.
 */
export function readPersonaId(getCookie?: (name: string) => string | undefined): PersonaId {
  if (getCookie) {
    try {
      return parse(getCookie(PERSONA_COOKIE));
    } catch {
      return DEFAULT_PERSONA_ID;
    }
  }
  return readFromDocument();
}

/** Client-only: persist the choice, then reload so the guards see it too. */
export function setPersonaId(id: PersonaId): void {
  if (typeof document === "undefined") return;
  document.cookie = `${PERSONA_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  window.location.reload();
}
