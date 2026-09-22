// Cliente de la API de links cortos. Si la API no está disponible (por
// ejemplo sin base de datos configurada), quien llama usa el link largo.

import { compactBouquet, expandCompact } from './share.js'

const API = '/api/bouquets'

export async function createShortLink(bouquet) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(compactBouquet(bouquet)),
  })
  if (!res.ok) throw new Error(`short_link_${res.status}`)
  const { id } = await res.json()
  if (!id) throw new Error('short_link_no_id')
  return `${window.location.origin}/r/${id}`
}

export async function fetchBouquet(id) {
  const res = await fetch(`${API}?id=${encodeURIComponent(id)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`fetch_${res.status}`)
  const { bouquet } = await res.json()
  return expandCompact(bouquet)
}
