// Codificación del ramo en un link de regalo.
// El ramo viaja completo dentro del hash de la URL: no hace falta servidor.

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
  const bin = atob(b64 + pad)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function compactBouquet(bouquet) {
  return {
    v: 1,
    i: bouquet.items.map((it) => [it.flower, it.color, it.qty]),
    w: bouquet.wrap,
    r: bouquet.ribbon,
    t: bouquet.to || undefined,
    f: bouquet.from || undefined,
    m: bouquet.message || undefined,
    l: encodeLayout(bouquet.layout),
  }
}

export function encodeBouquet(bouquet) {
  return toBase64Url(JSON.stringify(compactBouquet(bouquet)))
}

export function expandCompact(c) {
  if (!c || !Array.isArray(c.i)) return null
  return {
    items: c.i.map(([flower, color, qty]) => ({ flower, color, qty: Number(qty) || 1 })),
    wrap: c.w || 'kraft',
    ribbon: c.r || 'lino',
    to: c.t || '',
    from: c.f || '',
    message: c.m || '',
    layout: decodeLayout(c.l),
  }
}

const r2 = (v) => Math.round(v * 100) / 100

function encodeLayout(layout) {
  if (!layout) return undefined
  const rows = Object.entries(layout)
    .filter(([, p]) => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite))
    .map(([k, p]) => [k, r2(p[0]), r2(p[1]), r2(p[2])])
  return rows.length ? rows : undefined
}

function decodeLayout(rows) {
  const out = {}
  if (!Array.isArray(rows)) return out
  rows.forEach((row) => {
    if (!Array.isArray(row) || row.length !== 4) return
    const [k, x, y, z] = row
    if (typeof k === 'string' && [x, y, z].every((v) => typeof v === 'number' && Number.isFinite(v))) out[k] = [x, y, z]
  })
  return out
}

export function decodeBouquet(code) {
  try {
    return expandCompact(JSON.parse(fromBase64Url(code)))
  } catch {
    return null
  }
}

export function giftUrl(bouquet) {
  const base = window.location.origin + '/'
  return `${base}#/regalo/${encodeBouquet(bouquet)}`
}

export function builderUrl(bouquet, { gift = false } = {}) {
  const base = window.location.origin + '/'
  return `${base}#/armar/${encodeBouquet(bouquet)}${gift ? '/regalar' : ''}`
}
