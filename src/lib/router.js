import { useEffect, useState } from 'react'

// Router mínimo basado en el hash: funciona en cualquier hosting estático.
// Rutas: #/  ·  #/armar  ·  #/armar/<código>  ·  #/regalo/<código>
export function parseHash(hash = window.location.hash) {
  const clean = hash.replace(/^#\/?/, '')
  const [page, ...rest] = clean.split('/')
  const code = rest.join('/')
  if (page === 'armar') return { page: 'builder', code }
  if (page === 'regalo') return { page: 'gift', code }
  return { page: 'home', code: '' }
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash())
  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function navigate(hash) {
  if (window.location.hash === hash) return
  window.location.hash = hash
}
