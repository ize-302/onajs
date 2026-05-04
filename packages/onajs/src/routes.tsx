import { Route, Routes, Outlet } from 'react-router-dom'
import { Fragment } from 'react'
import type { ComponentType, ReactNode } from 'react'

export interface RouteNode {
  segment: string
  layout?: ComponentType<{ children?: ReactNode }>
  page?: ComponentType
  children: RouteNode[]
}

function renderNode(node: RouteNode, isRoot = false): ReactNode {
  const { segment, layout: L, page: P, children } = node

  if (!isRoot && /^\(.*\)$/.test(segment)) {
    if (L) {
      return (
        <Route key={segment} element={<L><Outlet /></L>}>
          {children.map(c => renderNode(c))}
        </Route>
      )
    }
    return <Fragment key={segment}>{children.map(c => renderNode(c))}</Fragment>
  }

  const routePath = isRoot ? '/' : segment

  if (L) {
    return (
      <Route key={routePath} path={routePath} element={<L><Outlet /></L>}>
        {P && <Route index element={<P />} />}
        {children.map(c => renderNode(c))}
      </Route>
    )
  }

  if (P) {
    if (!segment && !isRoot) return <Route key="index" index element={<P />} />
    if (children.length > 0) {
      return (
        <Route key={routePath} path={routePath}>
          <Route index element={<P />} />
          {children.map(c => renderNode(c))}
        </Route>
      )
    }
    return <Route key={routePath} path={routePath} element={<P />} />
  }

  return (
    <Route key={routePath} path={routePath} element={<Outlet />}>
      {children.map(c => renderNode(c))}
    </Route>
  )
}

export function OnaRoutes({ routes }: { routes: RouteNode }) {
  return <Routes>{renderNode(routes, true)}</Routes>
}
