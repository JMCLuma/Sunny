import { ArrowUpRight, Check } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import type { OperationsModule } from "../../navigation";
import { MODULE_CONTEXT, ORIGIN_LABELS, type ModuleContext } from "./module-context";

/**
 * A module that is navigable but not built.
 *
 * Deliberately not a mocked-up dashboard. Most of these already run in Luma
 * 1.0 and the merge carries them forward unchanged; drawing a replacement
 * would invite a decision against a screen nobody had designed. And a page of
 * controls that do nothing reads as broken, which is the reasoning behind the
 * original placeholder this replaces.
 *
 * What it does instead is answer the question a presenter actually gets —
 * "what happens to finance?" — with where it runs today, what the merge
 * changes, and which part of the BRD governs it.
 */
export function ModuleOutlinePage({ module }: { module: OperationsModule }) {
  const context: ModuleContext | undefined = MODULE_CONTEXT[module.id];

  if (!context) {
    return (
      <Alert>
        <AlertTitle>Not built in this wireframe</AlertTitle>
        <AlertDescription>{module.purpose}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={context.origin === "new" ? "default" : "secondary"}>
          {ORIGIN_LABELS[context.origin]}
        </Badge>
        {context.brdSection !== "—" ? (
          <Badge variant="outline">BRD {context.brdSection}</Badge>
        ) : null}
      </div>

      <p className="text-sm text-foreground">{module.purpose}</p>

      {context.todayIn ? (
        <section>
          <h2 className="text-sm font-semibold">Where this runs today</h2>
          <p className="mt-1 text-sm text-muted-foreground">{context.todayIn}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            It is not redrawn here. Re-specifying a system already in production would be invention,
            and the merge carries it forward as it stands.
          </p>
        </section>
      ) : null}

      {context.changes.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold">
            {context.todayIn ? "What Luma 2.0 changes" : "What this would cover"}
          </h2>
          <ul className="mt-2 space-y-2">
            {context.changes.map((change) => (
              <li key={change} className="flex gap-2 text-sm text-muted-foreground">
                <ArrowUpRight aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{change}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section>
          <h2 className="text-sm font-semibold">What Luma 2.0 changes</h2>
          <p className="mt-1 text-sm text-muted-foreground">Nothing. It carries forward as-is.</p>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold">Screens this module holds</h2>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {context.screens.map((screen) => (
            <li key={screen} className="flex gap-2 text-sm text-muted-foreground">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>{screen}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
