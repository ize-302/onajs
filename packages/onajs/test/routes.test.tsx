// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, Outlet, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { OnaRoutes, type RouteNode } from '../src/routes'

afterEach(cleanup)

function renderAt(routes: RouteNode, path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <OnaRoutes routes={routes} />
    </MemoryRouter>
  )
}

const Home = () => <p>Home</p>
const BlogList = () => <p>Blog list</p>
const BlogPost = () => { const { slug } = useParams(); return <p>Post: {slug}</p> }
const RootLayout = () => <div><span>Layout</span><Outlet /></div>
const BlogLayout = () => <div><span>Blog layout</span><Outlet /></div>

describe('OnaRoutes', () => {
  it('renders root page at /', () => {
    renderAt({ segment: '', page: Home, children: [] })
    expect(screen.getByText('Home')).toBeDefined()
  })

  it('renders child page at its path', () => {
    const routes: RouteNode = {
      segment: '',
      children: [{ segment: 'blog', page: BlogList, children: [] }]
    }
    renderAt(routes, '/blog')
    expect(screen.getByText('Blog list')).toBeDefined()
  })

  it('layout renders alongside root page', () => {
    const routes: RouteNode = { segment: '', layout: RootLayout, page: Home, children: [] }
    renderAt(routes)
    expect(screen.getByText('Layout')).toBeDefined()
    expect(screen.getByText('Home')).toBeDefined()
  })

  it('child renders inside parent layout via Outlet', () => {
    const routes: RouteNode = {
      segment: '',
      layout: RootLayout,
      children: [{ segment: 'blog', page: BlogList, children: [] }]
    }
    renderAt(routes, '/blog')
    expect(screen.getByText('Layout')).toBeDefined()
    expect(screen.getByText('Blog list')).toBeDefined()
  })

  it('nested layouts both render', () => {
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
    expect(screen.getByText('Layout')).toBeDefined()
    expect(screen.getByText('Blog layout')).toBeDefined()
    expect(screen.getByText('Blog list')).toBeDefined()
  })

  it('dynamic segment passes param to component', () => {
    const routes: RouteNode = {
      segment: '',
      children: [{
        segment: 'blog',
        children: [{ segment: ':slug', page: BlogPost, children: [] }]
      }]
    }
    renderAt(routes, '/blog/hello-world')
    expect(screen.getByText('Post: hello-world')).toBeDefined()
  })

  it('route group layout wraps children without adding URL segment', () => {
    const GroupLayout = ({ children }: { children?: ReactNode }) => (
      <div><span>Group layout</span>{children}</div>
    )
    const routes: RouteNode = {
      segment: '',
      children: [{
        segment: '(auth)',
        layout: GroupLayout,
        children: [{ segment: 'login', page: () => <p>Login</p>, children: [] }]
      }]
    }
    renderAt(routes, '/login')
    expect(screen.getByText('Group layout')).toBeDefined()
    expect(screen.getByText('Login')).toBeDefined()
  })

  it('route group without layout renders children at correct paths', () => {
    const routes: RouteNode = {
      segment: '',
      children: [{
        segment: '(group)',
        children: [{ segment: 'about', page: () => <p>About</p>, children: [] }]
      }]
    }
    renderAt(routes, '/about')
    expect(screen.getByText('About')).toBeDefined()
  })

  it('root page not rendered at child path', () => {
    const routes: RouteNode = {
      segment: '',
      page: Home,
      children: [{ segment: 'blog', page: BlogList, children: [] }]
    }
    renderAt(routes, '/blog')
    expect(screen.queryByText('Home')).toBeNull()
    expect(screen.getByText('Blog list')).toBeDefined()
  })
})
