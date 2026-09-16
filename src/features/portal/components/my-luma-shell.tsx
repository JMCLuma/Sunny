import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarCheck, ClipboardList, Home, Menu, Users, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Chrome for My Luma.
 *
 * Deliberately not the Operations shell. The two surfaces have opposite jobs:
 * Operations is a dense tool someone lives in all day, so it earns a sidebar
 * of twelve modules. My Luma is visited a handful of times a year, often on a
 * phone, often by someone who has not signed in since last summer — so it gets
 * four destinations along the top and nothing else competing for attention.
 *
 * The BRD asks for 360px support on these flows specifically. That is not a
 * nicety here: a parent completing a health form is doing it on a phone.
 */

interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

const NAV: readonly NavItem[] = [
  { to: "/my", label: "Overview", icon: Home },
  { to: "/my/household", label: "Family", icon: Users },
  { to: "/my/applications", label: "Applications", icon: ClipboardList },
  { to: "/my/programs", label: "My camps", icon: CalendarCheck },
];

export function MyLumaShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#my-luma-main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <Link to="/my" className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight">Luma</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Jubilee Monuments
            </span>
          </Link>

          <nav aria-label="My Luma" className="ms-auto hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink key={item.to} item={item} />
            ))}
          </nav>

          <div className="ms-auto md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu aria-hidden className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="end" className="w-72">
                <SheetTitle className="px-4 pt-4">My Luma</SheetTitle>
                <nav aria-label="My Luma" className="mt-4 flex flex-col gap-1 px-2">
                  {NAV.map((item) => (
                    <NavLink key={item.to} item={item} stacked />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main id="my-luma-main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({ item, stacked = false }: { item: NavItem; stacked?: boolean }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  // "/my" would otherwise light up on every child route.
  const active = item.to === "/my" ? pathname === "/my" : pathname.startsWith(item.to);
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        stacked && "w-full",
        active
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon aria-hidden className="size-4" />
      {item.label}
    </Link>
  );
}
