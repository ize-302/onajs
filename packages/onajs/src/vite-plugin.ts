import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import { scanRoutes, type RouteEntry } from './scan-routes'

const VIRTUAL = 'virtual:ona-manifest'
const RESOLVED = '\0' + VIRTUAL

export interface FileRouterOptions {
  pagesDir?: string
}

export function fileRouter(options: FileRouterOptions = {}): Plugin {
  const pagesDir = options.pagesDir ?? 'src/pages'
  let root = process.cwd()

  return {
    name: 'ona:file-router',

    configResolved(config: ResolvedConfig) {
      root = config.root
    },

    resolveId(id: string) {
      if (id === VIRTUAL) return RESOLVED
    },

    async load(id: string) {
      if (id !== RESOLVED) return
      const routes = await scanRoutes(root, pagesDir)
      return codegen(routes)
    },

    configureServer(server: ViteDevServer) {
      const invalidate = (file: string) => {
        if (!file.includes(pagesDir)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', invalidate)
      server.watcher.on('unlink', invalidate)
    }
  }
}

function codegen(routes: RouteEntry[]): string {
  const imports = routes
    .map((r, i) => `const _r${i} = lazy(() => import(${JSON.stringify(r.file)}))`)
    .join('\n')

  const manifest = routes
    .map((r, i) => `  { path: ${JSON.stringify(r.path)}, component: _r${i} }`)
    .join(',\n')

  return [
    `import { lazy } from 'react'`,
    imports,
    `\nexport const routes = [\n${manifest}\n]`
  ].join('\n')
}
