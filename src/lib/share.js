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

export function encodeBouquet(bouquet) {
  const compact = {
    v: 1,
    i: bouquet.items.map((it) => [it.flower, it.color, it.qty]),
    w: bouquet.wrap,
    r: bouquet.ribbon,
    t: bouquet.to || undefined,
    f: bouquet.from || undefined,
    m: bouquet.message || undefined,
  }
  return toBase64Url(JSON.stringify(compact))
}

export function decodeBouquet(code) {
  try {
    const c = JSON.parse(fromBase64Url(code))
    if (!c || !Array.isArray(c.i)) return null
    return {
      items: c.i.map(([flower, color, qty]) => ({ flower, color, qty: Number(qty) || 1 })),
      wrap: c.w || 'kraft',
      ribbon: c.r || 'lino',
      to: c.t || '',
      from: c.f || '',
      message: c.m || '',
    }
  } catch {
    return null
  }
}

export function giftUrl(bouquet) {
  const base = window.location.href.split('#')[0]
  return `${base}#/regalo/${encodeBouquet(bouquet)}`
}

export function builderUrl(bouquet) {
  const base = window.location.href.split('#')[0]
  return `${base}#/armar/${encodeBouquet(bouquet)}`
}
