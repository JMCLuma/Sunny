import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/camps/$slug")({
  component: () => (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Camp</h1>
      <p className="text-muted-foreground">Not built yet.</p>
    </div>
  ),
});
