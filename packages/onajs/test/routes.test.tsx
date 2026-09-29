// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, Outlet, useLoaderData, useParams } from 'react-router-dom'
import type { ComponentType, ReactNode } from 'react'
import { toRouteObjects, type RouteModule, type RouteNode } from '../src/routes'

afterEach(cleanup)

function renderAt(routes: RouteNode, path = '/') {
  const router = createMemoryRouter(toRouteObjects(routes), { initialEntries: [path] })
  render(<RouterProvider router={router} />)
}

// Mimics the `() => import(...)` functions the manifest generates
const mod = (C: ComponentType<any>, extra: Omit<RouteModule, 'default'> = {}) =>
  () => Promise.resolve({ default: C, ...extra })

const Home = mod(() => <p>Home</p>)
const BlogList = mod(() => <p>Blog list</p>)
const BlogPost = mod(() => { const { slug } = useParams(); return <p>Post: {slug}</p> })
const RootLayout = mod(() => <div><span>Layout</span><Outlet /></div>)
const BlogLayout = mod(({ children }: { children?: ReactNode }) => <div><span>Blog layout</span>{children}</div>)

describe('toRouteObjects', () => {
  it('renders root page at /', async () => {
    renderAt({ segment: '', page: Home, children: [] })
    expect(await screen.findByText('Home')).toBeDefined()
  })

  it('renders child page at its path', async () => {
    const routes: RouteNode = {
      segment: '',
      children: [{ segment: 'blog', page: BlogList, children: [] }]
    }
    renderAt(routes, '/blog')
    expect(await screen.findByText('Blog list')).toBeDefined()
  })

  it('layout renders alongside root page', async () => {
    const routes: RouteNode = { segment: '', layout: RootLayout, page: Home, children: [] }
    renderAt(routes)
    expect(await screen.findByText('Layout')).toBeDefined()
    expect(await screen.findByText('Home')).toBeDefined()
  })

  it('child renders inside parent layout via Outlet', async () => {
    const routes: RouteNode = {
      segment: '',
      layout: RootLayout,
      children: [{ segment: 'blog', page: BlogList, children: [] }]
    }
    renderAt(routes, '/blog')
    expect(await screen.findByText('Layout')).toBeDefined()
    expect(await screen.findByText('Blog list')).toBeDefined()
  })

  it('nested layouts both render, layout children prop works', async () => {
    const routes: RouteNode = {
      segment: '',
      layout: RootLayout,
      children: [{
        segment: 'blog',
        layout: BlogLayout,
        page: BlogList,
        children: []
      }]
    }
    renderAt(routes, '/blog')
    expect(await screen.findByText('Layout')).toBeDefined()
    expect(await screen.findByText('Blog layout')).toBeDefined()
    expect(await screen.findByText('Blog list')).toBeDefined()
  })

  it('dynamic segment passes param to component', async () => {
    const routes: RouteNode = {
      segment: '',
      children: [{
        segment: 'blog',
        children: [{ segment: ':slug', page: BlogPost, children: [] }]
      }]
    }
    renderAt(routes, '/blog/hello-world')
    expect(await screen.findByText('Post: hello-world')).toBeDefined()
  })

  it('route group layout wraps children without adding URL segment', async () => {
    const GroupLayout = mod(({ children }: { children?: ReactNode }) => (
      <div><span>Group layout</span>{children}</div>
    ))
    const routes: RouteNode = {
      segment: '',
      children: [{
        segment: '(auth)',
        layout: GroupLayout,
        children: [{ segment: 'login', page: mod(() => <p>Login</p>), children: [] }]
      }]
    }
    renderAt(routes, '/login')
    expect(await screen.findByText('Group layout')).toBeDefined()
    expect(await screen.findByText('Login')).toBeDefined()
  })

  it('route group without layout renders children at correct paths', async () => {
    const routes: RouteNode = {
      segment: '',
      children: [{
        segment: '(group)',
        children: [{ segment: 'about', page: mod(() => <p>About</p>), children: [] }]
      }]
    }
    renderAt(routes, '/about')
    expect(await screen.findByText('About')).toBeDefined()
  })

  it('root page not rendered at child path', async () => {
    const routes: RouteNode = {
      segment: '',
      page: Home,
      children: [{ segment: 'blog', page: BlogList, children: [] }]
    }
    renderAt(routes, '/blog')
    expect(await screen.findByText('Blog list')).toBeDefined()
    expect(screen.queryByText('Home')).toBeNull()
  })

  it('page loader data reaches the page', async () => {
    const Post = () => { const post = useLoaderData() as { title: string }; return <p>{post.title}</p> }
    const routes: RouteNode = {
      segment: '',
      children: [{
        segment: ':slug',
        page: mod(Post, { loader: ({ params }) => ({ title: `Title of ${params.slug}` }) }),
        children: []
      }]
    }
    renderAt(routes, '/hello')
    expect(await screen.findByText('Title of hello')).toBeDefined()
  })

  it('layout loader data reaches the layout', async () => {
    const Layout = ({ children }: { children?: ReactNode }) => {
      const user = useLoaderData() as string
      return <div><span>User: {user}</span>{children}</div>
    }
    const routes: RouteNode = {
      segment: '',
      layout: mod(Layout, { loader: () => 'ize' }),
      page: Home,
      children: []
    }
    renderAt(routes)
    expect(await screen.findByText('User: ize')).toBeDefined()
    expect(await screen.findByText('Home')).toBeDefined()
  })
})
