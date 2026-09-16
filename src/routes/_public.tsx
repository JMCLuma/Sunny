import { createFileRoute, Outlet } from "@tanstack/react-router";

import { SiteHeader } from "@/components/landing/site-header";

/**
 * Layout for the public website.
 *
 * The public header lives here rather than in `__root.tsx` so that non-public
 * areas — Operations, and anything else added later — simply do not sit under
 * this route. No component has to ask what the current URL is.
 */
export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <>
      <SiteHeader />
      <Outlet />
    </>
  );
}
