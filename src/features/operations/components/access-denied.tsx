import { ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isOperationsAccessDeniedError } from "../auth";

/**
 * Route-level error view for the Operations module.
 *
 * An authorization failure gets a specific, non-leaky explanation; anything
 * else falls back to a generic message so an unrelated crash is never
 * mislabelled as a permissions problem.
 */
export function OperationsRouteError({ error }: { error: Error }) {
  const denied = isOperationsAccessDeniedError(error);

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Alert variant={denied ? "default" : "destructive"}>
        <ShieldAlert className="size-4" aria-hidden="true" />
        <AlertTitle>{denied ? "You don't have access to this area" : "Something broke"}</AlertTitle>
        <AlertDescription>
          {denied
            ? "Your account doesn't carry the permission this Operations module requires. Ask an administrator if you think that's wrong."
            : "This Operations page didn't load. Try again, and let the team know if it keeps happening."}
        </AlertDescription>
      </Alert>
    </div>
  );
}
