import { createBrowserRouter, Outlet } from "react-router-dom";
import type {
  ActionFunction,
  LoaderFunction,
  RouteObject,
} from "react-router-dom";
import type { ComponentType, ReactNode } from "react";

export interface RouteModule {
  default: ComponentType<{ children?: ReactNode }>;
  loader?: LoaderFunction;
  action?: ActionFunction;
}

export type RouteImport = () => Promise<RouteModule>;

export interface RouteNode {
  segment: string;
  layout?: RouteImport;
  page?: RouteImport;
  notFound?: RouteImport;
  children: RouteNode[];
}

function lazyRoute(load: RouteImport, isLayout = false): RouteObject["lazy"] {
  return async () => {
    const { default: C, loader, action } = await load();
    return {
      Component: isLayout
        ? () => (
            <C>
              <Outlet />
            </C>
          )
        : C,
      ...(loader && { loader }),
      ...(action && { action }),
    };
  };
}

function toRoutes(node: RouteNode, isRoot = false): RouteObject[] {
  const { segment, layout: L, page: P, notFound: NF } = node;
  const children = node.children.flatMap((c) => toRoutes(c));

  // not-found becomes a catch-all inside this segment, unless the user
  // already defined their own [...rest] route at this level
  if (NF && !node.children.some((c) => c.segment === "*")) {
    children.push({ path: "*", lazy: lazyRoute(NF) });
  }

  if (!isRoot && /^\(.*\)$/.test(segment)) {
    // Route groups add no URL segment; without a layout they vanish entirely
    return L ? [{ lazy: lazyRoute(L, true), children }] : children;
  }

  const path = isRoot ? "/" : segment;

  if (L) {
    const index: RouteObject[] = P ? [{ index: true, lazy: lazyRoute(P) }] : [];
    return [
      { path, lazy: lazyRoute(L, true), children: [...index, ...children] },
    ];
  }

  if (P) {
    if (!segment && !isRoot) return [{ index: true, lazy: lazyRoute(P) }];
    if (children.length > 0) {
      return [
        { path, children: [{ index: true, lazy: lazyRoute(P) }, ...children] },
      ];
    }
    return [{ path, lazy: lazyRoute(P) }];
  }

  return [{ path, children }];
}

export function toRouteObjects(routes: RouteNode): RouteObject[] {
  return toRoutes(routes, true);
}

export function createOnaRouter(
  routes: RouteNode,
  opts?: Parameters<typeof createBrowserRouter>[1],
): ReturnType<typeof createBrowserRouter> {
  return createBrowserRouter(toRouteObjects(routes), opts);
}
