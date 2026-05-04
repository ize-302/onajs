import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdir, writeFile, rm, mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { scanRoutes } from '../src/scan-routes'

let dir: string

async function touch(...parts: string[]) {
  const abs = join(dir, ...parts)
  await mkdir(abs.slice(0, abs.lastIndexOf('/')), { recursive: true })
  await writeFile(abs, '')
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'onajs-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true })
})

describe('root node', () => {
  it('empty dir returns bare root', async () => {
    const tree = await scanRoutes(dir, '.')
    expect(tree).toEqual({ segment: '', children: [] })
  })

  it('page.tsx at root', async () => {
    await touch('page.tsx')
    const tree = await scanRoutes(dir, '.')
    expect(tree.pageFile).toMatch(/page\.tsx$/)
    expect(tree.layoutFile).toBeUndefined()
  })

  it('layout.tsx at root', async () => {
    await touch('layout.tsx')
    const tree = await scanRoutes(dir, '.')
    expect(tree.layoutFile).toMatch(/layout\.tsx$/)
    expect(tree.pageFile).toBeUndefined()
  })

  it('page.tsx + layout.tsx at root', async () => {
    await touch('page.tsx')
    await touch('layout.tsx')
    const tree = await scanRoutes(dir, '.')
    expect(tree.pageFile).toMatch(/page\.tsx$/)
    expect(tree.layoutFile).toMatch(/layout\.tsx$/)
  })
})

describe('nested segments', () => {
  it('blog with page and layout', async () => {
    await touch('blog', 'page.tsx')
    await touch('blog', 'layout.tsx')
    const tree = await scanRoutes(dir, '.')
    const blog = tree.children[0]
    expect(blog.segment).toBe('blog')
    expect(blog.pageFile).toMatch(/page\.tsx$/)
    expect(blog.layoutFile).toMatch(/layout\.tsx$/)
  })

  it('deeply nested child', async () => {
    await touch('blog', 'page.tsx')
    await touch('blog', 'posts', 'page.tsx')
    const tree = await scanRoutes(dir, '.')
    const blog = tree.children[0]
    expect(blog.segment).toBe('blog')
    expect(blog.children).toHaveLength(1)
    expect(blog.children[0].segment).toBe('posts')
  })
})

describe('dynamic segments', () => {
  it('[slug] becomes :slug', async () => {
    await touch('[slug]', 'page.tsx')
    const tree = await scanRoutes(dir, '.')
    expect(tree.children[0].segment).toBe(':slug')
  })

  it('[...rest] becomes *', async () => {
    await touch('[...rest]', 'page.tsx')
    const tree = await scanRoutes(dir, '.')
    expect(tree.children[0].segment).toBe('*')
  })

  it('blog/[slug]/page.tsx nests under blog', async () => {
    await touch('blog', 'page.tsx')
    await touch('blog', '[slug]', 'page.tsx')
    const tree = await scanRoutes(dir, '.')
    const blog = tree.children[0]
    expect(blog.segment).toBe('blog')
    expect(blog.children[0].segment).toBe(':slug')
  })
})

describe('sort order', () => {
  it('static before dynamic before catch-all', async () => {
    await touch('[...rest]', 'page.tsx')
    await touch('about', 'page.tsx')
    await touch('[slug]', 'page.tsx')
    const tree = await scanRoutes(dir, '.')
    const segments = tree.children.map(c => c.segment)
    expect(segments).toEqual(['about', ':slug', '*'])
  })
})

describe('route groups', () => {
  it('(group) folder preserves parens in segment', async () => {
    await touch('(auth)', 'login', 'page.tsx')
    const tree = await scanRoutes(dir, '.')
    const group = tree.children[0]
    expect(group.segment).toBe('(auth)')
    expect(group.children[0].segment).toBe('login')
  })

  it('(group) layout is captured', async () => {
    await touch('(auth)', 'layout.tsx')
    await touch('(auth)', 'login', 'page.tsx')
    const tree = await scanRoutes(dir, '.')
    const group = tree.children[0]
    expect(group.layoutFile).toMatch(/layout\.tsx$/)
  })
})

describe('appDir resolution', () => {
  it('resolves appDir relative to root', async () => {
    await mkdir(join(dir, 'src', 'app'), { recursive: true })
    await writeFile(join(dir, 'src', 'app', 'page.tsx'), '')
    const tree = await scanRoutes(dir, 'src/app')
    expect(tree.pageFile).toMatch(/page\.tsx$/)
  })
})
