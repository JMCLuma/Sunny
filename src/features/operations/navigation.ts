import {
  BarChart3,
  FileText,
  Handshake,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldCheck,
  TriangleAlert,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { AccessRequest, AuthorizedItem } from "./auth";

/**
 * The single registry of Operations modules.
 *
 * Route definitions, the sidebar, the mobile menu, breadcrumbs and the page
 * title all read from this list, so a module is added in one place. Each entry
 * carries the access request that guards it — the same object is used by the
 * route's `beforeLoad` and by navigation filtering, which is what keeps the
 * two from drifting apart.
 */

export type OperationsModuleId =
  | "overview"
  | "programs"
  | "finance"
  | "compliance"
  | "vendors"
  | "risk"
  | "documents"
  | "insights"
  | "marketing"
  | "admin";

export interface OperationsModule extends AuthorizedItem {
  readonly id: OperationsModuleId;
  /** Router route id, used to resolve the active module from route matches. */
  readonly routeId: string;
  readonly path: OperationsModulePath;
  /** Sidebar label and page heading. */
  readonly label: string;
  /** One sentence describing what the module is for. */
  readonly purpose: string;
  readonly icon: LucideIcon;
  readonly access: AccessRequest;
}

export const OPERATIONS_ROOT_PATH = "/operations";

/**
 * Literal paths rather than `string`, so `<Link to={module.path} />` is checked
 * against the generated route tree instead of accepting any string.
 */
export type OperationsModulePath =
  | "/operations"
  | "/operations/programs"
  | "/operations/finance"
  | "/operations/compliance"
  | "/operations/vendors"
  | "/operations/risk"
  | "/operations/documents"
  | "/operations/insights"
  | "/operations/marketing"
  | "/operations/admin";

export const OPERATIONS_MODULES: readonly OperationsModule[] = [
  {
    id: "overview",
    routeId: "/operations/",
    path: "/operations",
    label: "Overview",
    purpose: "A single view of programs, deadlines and anything waiting on a decision.",
    icon: LayoutDashboard,
    access: { resource: "operations", action: "view", scope: "any" },
  },
  {
    id: "programs",
    routeId: "/operations/programs",
    path: "/operations/programs",
    label: "Programs & people",
    purpose: "Programs, their sessions and events, and the people assigned to them.",
    icon: Users,
    access: { resource: "programs", action: "view", scope: "any" },
  },
  {
    id: "finance",
    routeId: "/operations/finance",
    path: "/operations/finance",
    label: "Finance",
    purpose: "Budgets, revenue and expenses, and the approvals that move them forward.",
    icon: Wallet,
    access: { resource: "finance", action: "view", scope: "any" },
  },
  {
    id: "compliance",
    routeId: "/operations/compliance",
    path: "/operations/compliance",
    label: "Compliance",
    purpose: "Requirements people must meet before serving, and how close each one is.",
    icon: ShieldCheck,
    access: { resource: "compliance", action: "view", scope: "any" },
  },
  {
    id: "vendors",
    routeId: "/operations/vendors",
    path: "/operations/vendors",
    label: "Vendors & contracts",
    purpose: "Suppliers, agreements and the renewal dates attached to them.",
    icon: Handshake,
    access: { resource: "vendors", action: "view", scope: "any" },
  },
  {
    id: "risk",
    routeId: "/operations/risk",
    path: "/operations/risk",
    label: "Risk & safety",
    purpose: "Safety follow-up and risk review, with confidential detail held separately.",
    icon: TriangleAlert,
    access: { resource: "risk", action: "view", scope: "any" },
  },
  {
    id: "documents",
    routeId: "/operations/documents",
    path: "/operations/documents",
    label: "Documents",
    purpose: "Policies, agreements and templates, with owners and review dates.",
    icon: FileText,
    access: { resource: "documents", action: "view", scope: "any" },
  },
  {
    id: "insights",
    routeId: "/operations/insights",
    path: "/operations/insights",
    label: "Surveys & insights",
    purpose: "Feedback collection and the reporting built on top of it.",
    icon: BarChart3,
    access: { resource: "insights", action: "view", scope: "any" },
  },
  {
    id: "marketing",
    routeId: "/operations/marketing",
    path: "/operations/marketing",
    label: "Marketing & comms",
    purpose: "Announcements, campaigns and the audiences they reach.",
    icon: Megaphone,
    access: { resource: "marketing", action: "view", scope: "any" },
  },
  {
    id: "admin",
    routeId: "/operations/admin",
    path: "/operations/admin",
    label: "Administration",
    purpose: "Organizations, roles, permissions and module configuration.",
    icon: Settings,
    access: { resource: "admin", action: "view", scope: "any" },
  },
];

const MODULES_BY_ID: ReadonlyMap<OperationsModuleId, OperationsModule> = new Map(
  OPERATIONS_MODULES.map((module) => [module.id, module]),
);

const MODULES_BY_ROUTE_ID: ReadonlyMap<string, OperationsModule> = new Map(
  OPERATIONS_MODULES.map((module) => [module.routeId, module]),
);

export function getOperationsModule(id: OperationsModuleId): OperationsModule {
  const module = MODULES_BY_ID.get(id);
  if (!module) {
    throw new Error(`Unknown Operations module "${id}".`);
  }
  return module;
}

/**
 * Resolves the active module from the router's matched route ids.
 *
 * Route ids rather than URL parsing: the layout asks the router what it
 * matched, so no component has to reason about path strings.
 */
export function findModuleByRouteIds(routeIds: readonly string[]): OperationsModule | null {
  for (let index = routeIds.length - 1; index >= 0; index -= 1) {
    const routeId = routeIds[index];
    if (routeId === undefined) continue;

    const exact = MODULES_BY_ROUTE_ID.get(routeId);
    if (exact) return exact;

    // A module owns its whole subtree: /operations/programs/$programId is
    // still Programs, so the sidebar and title do not go blank one level down.
    const nested = OPERATIONS_MODULES.find((module) => routeId.startsWith(`${module.routeId}/`));
    if (nested) return nested;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Breadcrumbs
//
// Assembled centrally from the matched routes. A route contributes only the
// label of the thing it loaded; it never builds a trail of its own, so there
// is one place that decides how the trail is shaped.
// ---------------------------------------------------------------------------

/**
 * Where a crumb links. A discriminated union rather than a bare string so the
 * breadcrumb renders a properly typed `<Link>` for each route shape instead of
 * casting a path.
 */
export type OperationsCrumbTarget =
  | { readonly kind: "module"; readonly to: OperationsModulePath }
  | { readonly kind: "events" }
  | { readonly kind: "program"; readonly programId: string }
  | {
      readonly kind: "instance";
      readonly programId: string;
      readonly instanceId: string;
    };

export interface OperationsBreadcrumb {
  readonly label: string;
  /** Absent on the final crumb: the page you are already on is not a link. */
  readonly target?: OperationsCrumbTarget;
}

/** Loader data shape a route uses to contribute its crumb. */
export interface OperationsCrumbCarrier {
  readonly crumb: OperationsBreadcrumb;
}

function readCrumb(loaderData: unknown): OperationsBreadcrumb | null {
  if (typeof loaderData !== "object" || loaderData === null) return null;
  const candidate = (loaderData as { crumb?: unknown }).crumb;
  if (typeof candidate !== "object" || candidate === null) return null;
  const label = (candidate as { label?: unknown }).label;
  return typeof label === "string" ? (candidate as OperationsBreadcrumb) : null;
}

export interface OperationsRouteMatch {
  readonly routeId: string;
  readonly loaderData?: unknown;
}

export interface OperationsPageContext {
  readonly module: OperationsModule | null;
  readonly crumbs: readonly OperationsBreadcrumb[];
  readonly title: string;
  /** The module blurb, shown only at a module's own root. */
  readonly description: string | null;
}

/**
 * Builds the trail, the page title and the module blurb from route matches.
 * Called once by the Operations shell; pages never repeat any of it.
 */
export function resolveOperationsPage(
  matches: readonly OperationsRouteMatch[],
): OperationsPageContext {
  const module = findModuleByRouteIds(matches.map((match) => match.routeId));

  const trail: OperationsBreadcrumb[] = [
    { label: "Operations", target: { kind: "module", to: OPERATIONS_ROOT_PATH } },
  ];

  if (module && module.id !== "overview") {
    trail.push({ label: module.label, target: { kind: "module", to: module.path } });
  }

  for (const match of matches) {
    const crumb = readCrumb(match.loaderData);
    if (crumb) trail.push(crumb);
  }

  const atModuleRoot = trail.length === (module && module.id !== "overview" ? 2 : 1);
  const last = trail[trail.length - 1];
  const crumbs = trail.map((crumb, index) =>
    index === trail.length - 1 ? { label: crumb.label } : crumb,
  );

  return {
    module,
    crumbs,
    title: last?.label ?? "Operations",
    description: atModuleRoot ? (module?.purpose ?? null) : null,
  };
}
