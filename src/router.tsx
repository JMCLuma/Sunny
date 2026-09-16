import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { resolvePersonaId } from "./features/demo/persona-cookie";
import { createOperationsRuntime } from "./features/operations/runtime";

export const getRouter = () => {
  const queryClient = new QueryClient();
  // Built here, once per router: TanStack Start creates a router per request,
  // so the server never shares an actor between requests. The demo persona is
  // read at the same moment and for the same reason — it is standing in for a
  // session, and a session is per request.
  const operations = createOperationsRuntime(resolvePersonaId());

  const router = createRouter({
    routeTree,
    context: { queryClient, operations },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
