import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * The frame for the signed-out identity screens.
 *
 * Signup and email verification sit outside both the public site's header and
 * the My Luma shell, on purpose: someone is mid-task, and a navigation bar
 * offering them Camps, Donate and About is an invitation to abandon it. What
 * stays is the wordmark — so they can tell whose product this is — and a way
 * back out that is clearly a way back out.
 */
export function AuthShell({
  title,
  lead,
  children,
  footer,
}: {
  title: string;
  lead: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight">Luma</span>
            <span className="text-xs text-muted-foreground">Jubilee Monuments</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:py-12">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{lead}</p>
        <div className="mt-6 space-y-6">{children}</div>
        {footer ? <div className="mt-8 text-sm text-muted-foreground">{footer}</div> : null}
      </main>
    </div>
  );
}
