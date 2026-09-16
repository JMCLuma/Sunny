import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import type { OperationsModule, OperationsModuleId } from "../navigation";

/**
 * The module list, shared by the desktop sidebar and the mobile menu.
 *
 * The caller passes an already-filtered list — filtering is an authorization
 * decision and is made once, in the shell, rather than in two places here.
 */
export function OperationsNav({
  modules,
  activeModuleId,
  onNavigate,
}: {
  modules: readonly OperationsModule[];
  activeModuleId: OperationsModuleId | null;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Operations modules">
      <ul className="space-y-1">
        {modules.map((module) => {
          const Icon = module.icon;
          const isActive = module.id === activeModuleId;

          return (
            <li key={module.id}>
              <Link
                to={module.path}
                onClick={onNavigate}
                // Without `exact`, the router treats "/operations" as active on
                // every child route, so two links would claim aria-current.
                activeOptions={{ exact: true }}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive
                    ? "bg-secondary font-medium text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{module.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
