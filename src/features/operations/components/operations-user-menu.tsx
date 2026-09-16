import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthorization } from "../auth";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * Placeholder account menu.
 *
 * The actor comes from the authorization service, never from the mock actor
 * module, so this component keeps working unchanged once a real session is
 * behind it. There are no account actions yet — offering a sign-out that does
 * nothing would be worse than saying plainly that authentication is not wired.
 */
export function OperationsUserMenu() {
  const { actor } = useAuthorization();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2" aria-label="Account menu">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground"
          >
            {initialsOf(actor.displayName)}
          </span>
          <span className="hidden text-sm font-medium sm:inline">{actor.displayName}</span>
          <ChevronDown className="size-3.5 opacity-70" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span>{actor.displayName}</span>
          <span className="text-xs font-normal text-muted-foreground">{actor.roleLabel}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="whitespace-normal text-xs leading-relaxed">
          Demo session. Sign-in and account settings arrive with authentication in a later phase.
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
