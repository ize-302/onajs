import { BrowserRouter } from 'react-router-dom'
import { Suspense } from 'react'
import { OnaRoutes } from '@ize-302/onajs/routes'
import { routes } from 'virtual:ona-manifest'

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <OnaRoutes routes={routes} />
      </Suspense>
    </BrowserRouter>
  )
}
