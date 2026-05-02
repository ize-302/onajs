# OnaJS

OnaJS is a file-based routing layer for React + Vite projects.

## Why OnaJS

In a plain Vite + React app, you manually define all routes in code. With OnaJS, you just create files in src/pages/ and routes are generated automatically -
similar to how Next.js or Remix handle routing, but without the full framework overhead.

## Quick start

```bash
npm create @ize-302/onajs@latest my-app
cd my-app
npm install
npm run dev
```

## Manual setup

To add OnaJS to an existing Vite + React project:

**1. Install**

```bash
npm install -D @ize-302/onajs
```

**2. Register the plugin**

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileRouter } from "@ize-302/onajs";

export default defineConfig({
  plugins: [react(), fileRouter()],
});
```

**3. Add the virtual module type** (for TypeScript)

```ts
// src/env.d.ts
/// <reference types="vite/client" />

declare module "virtual:ona-manifest" {
  import type { ComponentType } from "react";
  export const routes: Array<{
    path: string;
    component: ComponentType;
  }>;
}
```

**4. Render routes in your app**

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { routes } from "virtual:ona-manifest";

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          {routes.map(({ path, component: C }) => (
            <Route key={path} path={path} element={<C />} />
          ))}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**5. Create your first page**

```tsx
// src/pages/index.tsx
export default function Home() {
  return <h1>Hello OnaJS</h1>;
}
```

## File conventions

Files in `src/pages/` map directly to routes:

| File                           | Route         |
| ------------------------------ | ------------- |
| `src/pages/index.tsx`          | `/`           |
| `src/pages/about.tsx`          | `/about`      |
| `src/pages/blog/index.tsx`     | `/blog`       |
| `src/pages/blog/[slug].tsx`    | `/blog/:slug` |
| `src/pages/blog/[...rest].tsx` | `/blog/*`     |

Each file must export a default React component.

```tsx
// src/pages/blog/[slug].tsx
import { useParams } from "react-router-dom";

export default function BlogPost() {
  const { slug } = useParams();
  return <h1>{slug}</h1>;
}
```

Prefix a file with `_` to exclude it from routing (e.g. `_components.tsx`).

## How it works

OnaJS ships a Vite plugin (`fileRouter`) that scans `src/pages/` at build time and generates a virtual module `virtual:ona-manifest` containing lazy-loaded route definitions. No code generation in your project — it all lives in `node_modules`.

```ts
// vite.config.ts
import { fileRouter } from "@ize-302/onajs";

export default defineConfig({
  plugins: [react(), fileRouter({ pagesDir: "src/pages" })],
});
```

## Packages

| Package                                             | Description                 |
| --------------------------------------------------- | --------------------------- |
| [`@ize-302/onajs`](./packages/onajs)                | Vite plugin + route scanner |
| [`@ize-302/create-onajs`](./packages/create-onajs) | Project scaffolder          |

## Contributing

### Setup

```bash
git clone <repo>
npm install
npm run build   # compile packages/onajs → dist/
```

### Dev workflow

**1. Make changes**

Edit files in `packages/onajs/src/` or `packages/create-onajs/`.

**2. Build & verify**

```bash
npm run build
```

Test locally by pointing a scaffolded project at the local package:

```json
"@ize-302/onajs": "file:../packages/onajs"
```

Then `npm install && npm run dev` in that project.

For live rebuilds while iterating, run `npm run dev` from the root — tsup watches `src/` and rebuilds `dist/` on every save.

**3. Release**

Pick the right bump:

```bash
npm run release:patch   # bug fix         0.0.2 → 0.0.3
npm run release:minor   # new feature     0.0.2 → 0.1.0
npm run release:major   # breaking change 0.0.2 → 1.0.0
```

Each command bumps versions in both `package.json` files, builds `onajs`, then publishes both packages to npm.
