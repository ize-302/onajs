import path from 'node:path'
import fg from 'fast-glob'
const { glob } = fg

export interface RouteEntry {
  path: string
  file: string // absolute
}

export async function scanRoutes(root: string, pagesDir: string): Promise<RouteEntry[]> {
  const absDir = path.join(root, pagesDir)
  const files = await glob(`${absDir}/**/*.{ts,tsx}`, {
    ignore: [`${absDir}/**/_*.{ts,tsx}`]
  })
  return files.map((f: string) => fileToRoute(f, absDir)).sort(bySpecificity)
}

function fileToRoute(absFile: string, absDir: string): RouteEntry {
  const routePath =
    absFile
      .slice(absDir.length)
      .replace(/\.(tsx?)$/, '')
      .replace(/\/index$/, '/')
      .replace(/\[\.\.\.(\w+)\]/g, '*')
      .replace(/\[(\w+)\]/g, ':$1')
      .replace(/\/$/, '') || '/'

  return { path: routePath, file: absFile }
}

function bySpecificity(a: RouteEntry, b: RouteEntry): number {
  const rank = (r: RouteEntry) =>
    r.path.includes('*') ? 2 : r.path.includes(':') ? 1 : 0
  return rank(a) - rank(b)
}
