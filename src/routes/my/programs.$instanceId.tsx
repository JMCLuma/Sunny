import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/my/programs/$instanceId")({
  component: () => (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Camp checklist</h1>
      <p className="text-muted-foreground">Not built yet.</p>
    </div>
  ),
});
