import { Link } from "@tanstack/react-router";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Shown when a route resolves to nothing — an id that does not exist, or an
 * instance asked for under the wrong program. Both say the same thing on
 * purpose: confirming that a record exists somewhere else is itself a leak.
 */
export function OperationsNotFound({
  title = "Not found",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center">
      <FileQuestion className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
      <h2 className="mt-3 text-base font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Button asChild variant="outline" className="mt-5">
        <Link to="/operations/programs">Back to Programs</Link>
      </Button>
    </div>
  );
}
