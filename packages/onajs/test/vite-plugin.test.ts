import { describe, it, expect } from 'vitest'
import { isRouteFile } from '../src/vite-plugin'

describe('isRouteFile', () => {
  it('matches page and layout files under appDir', () => {
    expect(isRouteFile('/proj/src/app/page.tsx', '/proj', 'src/app')).toBe(true)
    expect(isRouteFile('/proj/src/app/blog/layout.ts', '/proj', 'src/app')).toBe(true)
  })

  it('matches Windows backslash paths', () => {
    expect(isRouteFile('C:\\proj\\src\\app\\blog\\page.tsx', 'C:\\proj', 'src/app')).toBe(true)
  })

  it('ignores non-route files', () => {
    expect(isRouteFile('/proj/src/app/utils.ts', '/proj', 'src/app')).toBe(false)
    expect(isRouteFile('/proj/src/app/mypage.tsx', '/proj', 'src/app')).toBe(false)
  })

  it('ignores files outside appDir', () => {
    expect(isRouteFile('/other/src/app/page.tsx', '/proj', 'src/app')).toBe(false)
    expect(isRouteFile('/proj/src/application/page.tsx', '/proj', 'src/app')).toBe(false)
  })
})
