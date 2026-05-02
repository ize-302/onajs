import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'
import { routes } from 'virtual:ona-manifest'

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
  )
}
