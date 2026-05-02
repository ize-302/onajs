/// <reference types="vite/client" />

declare module 'virtual:ona-manifest' {
  import type { ComponentType } from 'react'
  export const routes: Array<{
    path: string
    component: ComponentType
  }>
}
