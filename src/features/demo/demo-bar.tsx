import { useRouterState } from "@tanstack/react-router";
import { ChevronDown, CircleHelp, FlaskConical, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { decisionsForRoute, type OpenDecision } from "./decisions";
import { setPersonaId } from "./current-persona";
import { DEMO_PERSONAS, getPersona, type PersonaId } from "./personas";

/**
 * The strip along the bottom of every page.
 *
 * Two jobs, and it should not grow a third. It says plainly that this is a
 * wireframe on invented data — a branded prototype reads as further along than
 * it is, and someone should not leave the room believing this ships tomorrow.
 * And it carries the persona switcher, which is the demo's main instrument:
 * switching re-reads the cookie and reloads, so the route guards themselves
 * change their answer rather than the chrome merely hiding links.
 *
 * Fixed to the bottom rather than the top so it never competes with the
 * product's own header, and so a screenshot of a page is still a screenshot of
 * that page.
 */
export function DemoBar({ personaId }: { personaId: string }) {
  const [showDecisions, setShowDecisions] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const decisions = decisionsForRoute(pathname);

  return (
    <>
      {showDecisions ? (
        <DecisionsPanel decisions={decisions} onClose={() => setShowDecisions(false)} />
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm">
          <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
            <FlaskConical aria-hidden className="size-4" />
            Wireframe
          </span>
          <span className="hidden text-muted-foreground sm:inline">
            Invented data. Nothing here is saved.
          </span>

          <div className="ms-auto flex items-center gap-2">
            {decisions.length > 0 ? (
              <Button
                variant={showDecisions ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowDecisions((open) => !open)}
              >
                <CircleHelp aria-hidden className="size-4" />
                Open decisions
                <Badge variant="outline">{decisions.length}</Badge>
              </Button>
            ) : null}
            <PersonaSwitcher personaId={personaId} />
          </div>
        </div>
      </div>

      {/* Keeps the bar from covering the end of a long page. */}
      <div aria-hidden className="h-14" />
    </>
  );
}

function PersonaSwitcher({ personaId }: { personaId: string }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const current = getPersona(personaId);

  const families = DEMO_PERSONAS.filter((persona) => persona.surface === "family");
  const operations = DEMO_PERSONAS.filter((persona) => persona.surface === "operations");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <span className="text-muted-foreground">Viewing as</span>
          <span className="font-medium">{current.label}</span>
          <ChevronDown aria-hidden className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Families</DropdownMenuLabel>
        {families.map((persona) => (
          <PersonaItem key={persona.id} id={persona.id} />
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Staff</DropdownMenuLabel>
        {operations.map((persona) => (
          <PersonaItem key={persona.id} id={persona.id} />
        ))}
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-xs text-muted-foreground">
          Switching reloads {pathname} as that person. Permissions are real: some pages will refuse
          you.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PersonaItem({ id }: { id: PersonaId }) {
  const persona = getPersona(id);
  return (
    <DropdownMenuItem
      className="flex-col items-start gap-0.5"
      onSelect={() => setPersonaId(persona.id)}
    >
      <span className="font-medium">{persona.label}</span>
      <span className="text-xs text-muted-foreground">{persona.summary}</span>
    </DropdownMenuItem>
  );
}

const STATUS_TONE: Record<OpenDecision["status"], "default" | "secondary" | "outline"> = {
  open: "outline",
  assumed: "secondary",
  decided: "default",
};

const STATUS_LABEL: Record<OpenDecision["status"], string> = {
  open: "Still open",
  assumed: "Assumed here",
  decided: "Decided",
};

/**
 * What this screen had to assume, and who is owed an answer.
 *
 * Deliberately not a tooltip on a field: the point is to make the shape of the
 * remaining decision visible, including where it came from, so the discussion
 * happens once rather than at every review.
 */
function DecisionsPanel({
  decisions,
  onClose,
}: {
  decisions: readonly OpenDecision[];
  onClose: () => void;
}) {
  return (
    <aside
      aria-label="Open decisions for this screen"
      className="fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col border-s border-border bg-card shadow-xl"
    >
      <header className="flex items-start justify-between gap-4 border-b border-border p-4">
        <div>
          <h2 className="text-base font-semibold">Open decisions</h2>
          <p className="text-sm text-muted-foreground">
            What this screen assumed, and where the question was raised.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X aria-hidden className="size-4" />
        </Button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {decisions.map((decision) => (
          <article key={decision.id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium">{decision.question}</h3>
              <Badge variant={STATUS_TONE[decision.status]}>{STATUS_LABEL[decision.status]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">This wireframe: </span>
              {decision.assumption}
            </p>
            <p className="text-xs text-muted-foreground">{decision.source}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}
