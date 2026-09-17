import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/onboarding")({
  component: () => (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome to Luma</h1>
      <p className="text-muted-foreground">Not built yet.</p>
    </div>
  ),
});
