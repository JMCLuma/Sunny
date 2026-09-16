import { useMatches } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuthorization } from "../auth";
import { OPERATIONS_MODULES, resolveOperationsPage } from "../navigation";
import { OperationsBrand } from "./operations-brand";
import { OperationsBreadcrumbs } from "./operations-breadcrumbs";
import { OperationsNav } from "./operations-nav";
import { OperationsThemeToggle } from "./operations-theme-toggle";
import { OperationsUserMenu } from "./operations-user-menu";

/**
 * The Operations chrome: sidebar, mobile menu, breadcrumbs, page title and
 * account menu.
 *
 * The public `SiteHeader` is deliberately absent — Operations is a separate
 * layout route, not the public site with a different body.
 */
export function OperationsShell({ children }: { children: ReactNode }) {
  const authorization = useAuthorization();
  const matches = useMatches();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Navigation only shows what the actor may open. Routes enforce the same
  // rule in `beforeLoad`, so hiding a link is presentation, not protection.
  const modules = authorization.filterAuthorized(OPERATIONS_MODULES);
  // One call decides the active module, the breadcrumb trail and the page
  // title, so a page never restates any of them.
  const page = resolveOperationsPage(matches);
  const activeModuleId = page.module?.id ?? null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <a
        href="#operations-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to main content
      </a>

      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
        <div className="sticky top-0 flex h-screen flex-col gap-6 p-4">
          <OperationsBrand />
          <OperationsNav modules={modules} activeModuleId={activeModuleId} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4">
                <SheetHeader className="p-0 text-left">
                  <SheetTitle className="sr-only">Operations navigation</SheetTitle>
                  <OperationsBrand />
                </SheetHeader>
                <div className="mt-6">
                  <OperationsNav
                    modules={modules}
                    activeModuleId={activeModuleId}
                    onNavigate={() => setIsMobileNavOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <OperationsBreadcrumbs crumbs={page.crumbs} />
            </div>

            <div className="flex items-center gap-1">
              <OperationsThemeToggle />
              <OperationsUserMenu />
            </div>
          </div>

          <div className="px-4 pb-4 sm:px-6">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{page.title}</h1>
            {page.description ? (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{page.description}</p>
            ) : null}
          </div>
        </header>

        <main id="operations-content" className="flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
