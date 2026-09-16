import { Link } from "@tanstack/react-router";

import { OPERATIONS_ROOT_PATH } from "../navigation";

/** Wordmark used in the sidebar and the mobile menu. */
export function OperationsBrand() {
  return (
    <Link
      to={OPERATIONS_ROOT_PATH}
      // The wordmark is a shortcut home, not the current page marker.
      activeOptions={{ exact: true }}
      className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <img src="/jmc-logo.png" alt="" aria-hidden="true" className="block h-8 w-auto" />
      <span className="flex flex-col leading-tight">
        <span className="text-base font-bold tracking-tight text-foreground">Luma</span>
        <span className="text-xs text-muted-foreground">Operations</span>
      </span>
    </Link>
  );
}
