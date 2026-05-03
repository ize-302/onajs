import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/vite-plugin.ts', 'src/routes.tsx'],
  format: ['esm'],
  dts: true,
  clean: true,
})
