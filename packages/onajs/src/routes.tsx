import { Route, Routes, Outlet } from 'react-router-dom'
import type { ComponentType, ReactNode } from 'react'

export interface RouteNode {
  segment: string
  layout?: ComponentType
  page?: ComponentType
  children: RouteNode[]
}

function renderNode(node: RouteNode, isRoot = false): ReactNode {
  const { segment, layout: L, page: P, children } = node
  const routePath = isRoot ? '/' : segment

  if (L) {
    return (
      <Route key={routePath} path={routePath} element={<L />}>
        {P && <Route index element={<P />} />}
        {children.map(c => renderNode(c))}
      </Route>
    )
  }

  if (P) {
    if (!segment && !isRoot) return <Route key="index" index element={<P />} />
    return (
      <Route key={routePath} path={routePath} element={<P />}>
        {children.map(c => renderNode(c))}
      </Route>
    )
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
