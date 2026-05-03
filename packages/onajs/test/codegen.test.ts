import { describe, it, expect } from 'vitest'
import { codegen } from '../src/vite-plugin'
import type { RouteNode } from '../src/scan-routes'

function node(
  segment: string,
  opts: { pageFile?: string; layoutFile?: string; children?: RouteNode[] } = {}
): RouteNode {
  return { segment, children: [], ...opts }
}

describe('codegen', () => {
  it('always starts with lazy import', () => {
    const out = codegen(node(''))
    expect(out).toMatch(/^import \{ lazy \} from 'react'/)
  })

  it('always exports routes', () => {
    const out = codegen(node(''))
    expect(out).toContain('export const routes =')
  })

  it('empty root produces no lazy imports', () => {
    const out = codegen(node(''))
    expect(out).not.toContain('lazy(')
  })

  it('page file generates lazy import', () => {
    const out = codegen(node('', { pageFile: '/app/page.tsx' }))
    expect(out).toContain(`lazy(() => import("/app/page.tsx"))`)
  })

  it('layout file generates lazy import', () => {
    const out = codegen(node('', { layoutFile: '/app/layout.tsx' }))
    expect(out).toContain(`lazy(() => import("/app/layout.tsx"))`)
  })

  it('page referenced as page in routes object', () => {
    const out = codegen(node('', { pageFile: '/app/page.tsx' }))
    expect(out).toMatch(/page: _c\d+/)
  })

  it('layout referenced as layout in routes object', () => {
    const out = codegen(node('', { layoutFile: '/app/layout.tsx' }))
    expect(out).toMatch(/layout: _c\d+/)
  })

  it('page and layout get separate ids', () => {
    const out = codegen(node('', { pageFile: '/app/page.tsx', layoutFile: '/app/layout.tsx' }))
    const ids = out.match(/_c\d+/g) ?? []
    const unique = new Set(ids)
    expect(unique.size).toBe(2)
  })

  it('same file referenced twice gets one import', () => {
    const shared = '/app/page.tsx'
    const tree = node('', {
      pageFile: shared,
      children: [node('about', { pageFile: shared })]
    })
    const out = codegen(tree)
    const matches = out.match(/lazy\(\(\) => import\("\/app\/page\.tsx"\)\)/g) ?? []
    expect(matches).toHaveLength(1)
  })

  it('dynamic segment preserved in output', () => {
    const tree = node('', { children: [node(':slug', { pageFile: '/app/[slug]/page.tsx' })] })
    const out = codegen(tree)
    expect(out).toContain(`segment: ":slug"`)
  })

  it('root segment is empty string', () => {
    const out = codegen(node(''))
    expect(out).toContain(`segment: ""`)
  })

  it('nested children are serialized recursively', () => {
    const tree = node('', {
      children: [
        node('blog', {
          pageFile: '/app/blog/page.tsx',
          children: [node(':slug', { pageFile: '/app/blog/[slug]/page.tsx' })]
        })
      ]
    })
    const out = codegen(tree)
    expect(out).toContain(`segment: "blog"`)
    expect(out).toContain(`segment: ":slug"`)
    expect(out).toContain(`lazy(() => import("/app/blog/page.tsx"))`)
    expect(out).toContain(`lazy(() => import("/app/blog/[slug]/page.tsx"))`)
  })
})
