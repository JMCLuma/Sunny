import { Link } from "@tanstack/react-router";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { OperationsBreadcrumb, OperationsCrumbTarget } from "../navigation";

/**
 * Renders the trail assembled by `resolveOperationsPage`.
 *
 * The target union is unpacked here so each route shape gets a correctly typed
 * `<Link>`; nothing casts a path string. `exact` matching keeps an ancestor
 * crumb from claiming to be the current page.
 */
function CrumbLink({ target, label }: { target: OperationsCrumbTarget; label: string }) {
  switch (target.kind) {
    case "module":
      return (
        <Link to={target.to} activeOptions={{ exact: true }}>
          {label}
        </Link>
      );
    case "events":
      return (
        <Link to="/operations/programs/events" activeOptions={{ exact: true }}>
          {label}
        </Link>
      );
    case "program":
      return (
        <Link
          to="/operations/programs/$programId"
          params={{ programId: target.programId }}
          activeOptions={{ exact: true }}
        >
          {label}
        </Link>
      );
    case "instance":
      return (
        <Link
          to="/operations/programs/$programId/instances/$instanceId"
          params={{ programId: target.programId, instanceId: target.instanceId }}
          activeOptions={{ exact: true }}
        >
          {label}
        </Link>
      );
    default:
      return <>{label}</>;
  }
}

export function OperationsBreadcrumbs({ crumbs }: { crumbs: readonly OperationsBreadcrumb[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <Fragment key={`${crumb.label}-${index}`}>
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem>
              {crumb.target ? (
                <BreadcrumbLink asChild>
                  <CrumbLink target={crumb.target} label={crumb.label} />
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
