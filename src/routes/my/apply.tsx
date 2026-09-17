import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/my/apply")({
  component: () => (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Apply to a camp</h1>
      <p className="text-muted-foreground">Not built yet.</p>
    </div>
  ),
});
