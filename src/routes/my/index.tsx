import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/my/")({
  component: () => (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">My Luma</h1>
      <p className="text-muted-foreground">The household dashboard lands here.</p>
    </div>
  ),
});
