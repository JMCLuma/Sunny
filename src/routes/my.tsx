import { createFileRoute, Outlet } from "@tanstack/react-router";

import { MyLumaShell } from "@/features/portal/components/my-luma-shell";

/**
 * Layout for My Luma — everything a family or an applicant sees once signed in.
 *
 * The third surface, alongside the public site and Operations. It gets its own
 * layout route for the same reason they do: the chrome is decided by where you
 * are in the route tree, never by a component inspecting the URL.
 *
 * No permission guard here. My Luma is scoped by *whose records you may see*,
 * not by a module permission — a parent holds no Operations grants at all, and
 * what they may do for a given child comes from a relationship and an access
 * grant. That check belongs on the records, not on the front door.
 */
export const Route = createFileRoute("/my")({
  component: MyLumaLayout,
});

function MyLumaLayout() {
  return (
    <MyLumaShell>
      <Outlet />
    </MyLumaShell>
  );
}
