import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Suspense } from 'react'
import { OnaRoutes } from '@ize-302/onajs/routes'
import { routes } from 'virtual:ona-manifest'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={null}>
        <OnaRoutes routes={routes} />
      </Suspense>
    </BrowserRouter>
  </StrictMode>
)
