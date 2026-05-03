import path from 'node:path'
import fg from 'fast-glob'
const { glob } = fg

export interface RouteNode {
  segment: string
  pageFile?: string
  layoutFile?: string
  children: RouteNode[]
}

export async function scanRoutes(root: string, appDir: string): Promise<RouteNode> {
  const absDir = path.join(root, appDir)
  const files = await glob(`${absDir}/**/{page,layout}.{ts,tsx}`)

  const dirMap = new Map<string, { page?: string; layout?: string }>()

  for (const f of files) {
    const dir = path.dirname(f)
    const base = path.basename(f, path.extname(f))

    let d = dir
    while (d.startsWith(absDir)) {
      if (!dirMap.has(d)) dirMap.set(d, {})
      if (d === absDir) break
      d = path.dirname(d)
    }

    const entry = dirMap.get(dir)!
    if (base === 'page') entry.page = f
    else if (base === 'layout') entry.layout = f
  }

  return buildNode(absDir, absDir, dirMap)
}

function buildNode(
  absDir: string,
  dir: string,
  dirMap: Map<string, { page?: string; layout?: string }>
): RouteNode {
  const entry = dirMap.get(dir) ?? {}
  const rawSegment = path.basename(dir)
  const segment =
    dir === absDir
      ? ''
      : rawSegment
          .replace(/\[\.\.\.(\w+)\]/g, '*')
          .replace(/\[(\w+)\]/g, ':$1')

  const children: RouteNode[] = []
  for (const [childDir] of dirMap) {
    if (path.dirname(childDir) === dir && childDir !== dir) {
      children.push(buildNode(absDir, childDir, dirMap))
    }
  }

  children.sort((a, b) => {
    const rank = (s: string) => (s === '*' ? 2 : s.startsWith(':') ? 1 : 0)
    return rank(a.segment) - rank(b.segment)
  })

  return {
    segment,
    ...(entry.page && { pageFile: entry.page }),
    ...(entry.layout && { layoutFile: entry.layout }),
    children,
  }
}
