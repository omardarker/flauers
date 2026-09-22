import { useEffect, useState } from 'react'

// Router mínimo basado en el hash: funciona en cualquier hosting estático.
// Rutas: #/  ·  #/armar  ·  #/armar/<código>[/regalar]  ·  #/regalo/<código>
// Link corto: /r/<id> (Vercel lo reescribe a index.html; el ramo se pide a la API)
export function parseHash(hash = window.location.hash) {
  const short = window.location.pathname.match(/^\/r\/([A-Za-z0-9]{4,16})\/?$/)
  if (short) return { page: 'gift', code: '', id: short[1] }
  const clean = hash.replace(/^#\/?/, '')
  const [page, ...rest] = clean.split('/')
  if (page === 'armar') {
    const gift = rest[rest.length - 1] === 'regalar'
    const code = (gift ? rest.slice(0, -1) : rest).join('/')
    return { page: 'builder', code, gift }
  }
  if (page === 'regalo') return { page: 'gift', code: rest.join('/') }
  if (page.startsWith('lab')) return { page: 'lab', code: '' }
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
  // desde un link corto (/r/<id>) volvemos a la raíz para que el hash funcione
  if (window.location.pathname !== '/' && !window.location.pathname.endsWith('/index.html')) {
    window.location.href = `${window.location.origin}/${hash}`
    return
  }
  if (window.location.hash === hash) return
  window.location.hash = hash
}
