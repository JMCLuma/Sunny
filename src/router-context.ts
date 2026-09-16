import type { QueryClient } from "@tanstack/react-query";

import type { OperationsRuntime } from "@/features/operations/runtime";

/**
 * Router context, shared by `__root.tsx` and `router.tsx`.
 *
 * Router context is the right home for things that must not be serialized —
 * the query client and the Operations runtime both hold methods. Values
 * returned from a route's `beforeLoad` are serialized for SSR, so services
 * belong here instead.
 */
export interface AppRouterContext {
  queryClient: QueryClient;
  /** Authorization service + data repository for the Operations module. */
  operations: OperationsRuntime;
}
