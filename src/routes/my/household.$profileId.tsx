import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/my/household/$profileId")({
  component: () => <div>detail</div>,
});
