# OnaJS

OnaJS is a file-based routing layer for React + Vite projects.

## Why OnaJS

In a plain Vite + React app, you manually define all routes in code. With OnaJS, you just create files in `src/app/` and routes are generated automatically — similar to how Next.js App Router handles routing, but without the full framework overhead.

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
npm install react-router-dom
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
  import type { RouteNode } from "@ize-302/onajs/routes";
  export const routes: RouteNode;
}
```

**4. Render routes in your app**

```tsx
// src/App.tsx
import { BrowserRouter } from "react-router-dom";
import { Suspense } from "react";
import { OnaRoutes } from "@ize-302/onajs/routes";
import { routes } from "virtual:ona-manifest";

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <OnaRoutes routes={routes} />
      </Suspense>
    </BrowserRouter>
  );
}
```

**5. Create your first page**

```tsx
// src/app/page.tsx
export default function Home() {
  return <h1>Hello OnaJS</h1>;
}
```

## File conventions

Files in `src/app/` follow Next.js-style app router conventions:

| File                              | Route         |
| --------------------------------- | ------------- |
| `src/app/page.tsx`                | `/`           |
| `src/app/about/page.tsx`          | `/about`      |
| `src/app/blog/page.tsx`           | `/blog`       |
| `src/app/blog/[slug]/page.tsx`    | `/blog/:slug` |
| `src/app/blog/[...rest]/page.tsx` | `/blog/*`     |

Each `page.tsx` must export a default React component.

```tsx
// src/app/blog/[slug]/page.tsx
import { useParams } from "react-router-dom";

export default function BlogPost() {
  const { slug } = useParams();
  return <h1>{slug}</h1>;
}
```

### Layouts

Place a `layout.tsx` alongside any `page.tsx` to wrap that segment and all its children. Layouts receive a `children` prop where child routes are rendered — no need to import `<Outlet />`.

```tsx
// src/app/layout.tsx
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children?: ReactNode }) {
  return (
    <div>
      <nav>{/* shared nav */}</nav>
      {children}
    </div>
  );
}
```

Layouts nest automatically. A `layout.tsx` inside `src/app/blog/` only wraps the blog segment.

## How it works

OnaJS ships a Vite plugin (`fileRouter`) that scans `src/app/` at build time and generates a virtual module `virtual:ona-manifest` containing a lazy-loaded route tree. `OnaRoutes` (from `@ize-302/onajs/routes`) walks the tree and renders the corresponding nested `<Route>` elements. No code generation in your project — it all lives in `node_modules`.

## Plugin options

```ts
fileRouter({
  appDir: "src/app", // default
})
```

## Packages

| Package                                            | Description                      |
| -------------------------------------------------- | -------------------------------- |
| [`@ize-302/onajs`](./packages/onajs)               | Vite plugin, route scanner, renderer |
| [`@ize-302/create-onajs`](./packages/create-onajs) | Project scaffolder               |

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

**2. Build & test locally**

```bash
npm run build
npm pack -w packages/onajs   # produces a tarball

node packages/create-onajs/bin/index.js example
cd example
npm install
npm install /path/to/ize-302-onajs-x.x.x.tgz
npm run dev
```

For live rebuilds while iterating, run `npm run dev` from the root — tsup watches `src/` and rebuilds `dist/` on every save.

**3. Open a PR**

Push your branch and open a pull request.
