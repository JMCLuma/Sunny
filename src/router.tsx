import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { createOperationsRuntime } from "./features/operations/runtime";

export const getRouter = () => {
  const queryClient = new QueryClient();
  // Built here, once per router: TanStack Start creates a router per request,
  // so the server never shares an actor between requests.
  const operations = createOperationsRuntime();

  const router = createRouter({
    routeTree,
    context: { queryClient, operations },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
