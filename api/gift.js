// Página del regalo (/r/<id>): devuelve el index.html de la app con título e
// imagen de vista previa propios del regalo, para que WhatsApp, iMessage o
// Telegram muestren "Tienes un ramo para ti" en lugar de la portada.

import { Redis } from '@upstash/redis'

function findEnv(suffixes) {
  for (const suffix of suffixes) {
    const key = Object.keys(process.env).find((k) => k.endsWith(suffix) && process.env[k])
    if (key) return process.env[key]
  }
  return null
}

function redis() {
  const url = findEnv(['KV_REST_API_URL', 'REST_API_URL', 'REDIS_REST_URL'])
  const token = findEnv(['KV_REST_API_TOKEN', 'REST_API_TOKEN', 'REDIS_REST_TOKEN'])
  if (!url || !token) return null
  return new Redis({ url, token })
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

let indexCache = null
async function loadIndex(origin) {
  if (indexCache) return indexCache
  const res = await fetch(`${origin}/index.html`)
  if (!res.ok) throw new Error(`index_${res.status}`)
  indexCache = await res.text()
  return indexCache
}

export default async function handler(req, res) {
  const id = String(req.query?.id || '')
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const origin = `${proto}://${host}`

  let to = ''
  let message = ''
  let from = ''
  let found = false
  if (/^[A-Za-z0-9]{4,16}$/.test(id)) {
    try {
      const db = redis()
      const data = db ? await db.get(`bouquet:${id}`) : null
      if (data) {
        found = true
        to = typeof data.t === 'string' ? data.t : ''
        message = typeof data.m === 'string' ? data.m : ''
        from = typeof data.f === 'string' ? data.f : ''
      }
    } catch (err) {
      console.error(err)
    }
  }

  const title = found ? (to ? `Tienes un ramo para ti, ${to} 💐` : 'Tienes un ramo para ti 💐') : 'Flauers · Ramos en 3D'
  const description = found
    ? message
      ? `“${message.slice(0, 120)}”${from ? ` — ${from}` : ''}`
      : `${from ? `${from} te envió` : 'Te enviaron'} un ramo en 3D. Ábrelo y gíralo para verlo desde todos los ángulos.`
    : 'Elige tus flores, arma un ramo en 3D y regálalo con un link.'
  const image = `${origin}/${found ? 'og-gift.jpg' : 'og-home.jpg'}`
  const url = `${origin}/r/${id}`

  const meta = `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Flauers" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${esc(url)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(image)}" />`

  try {
    let html = await loadIndex(origin)
    // quita el título y las etiquetas og/description de la portada y añade las del regalo
    html = html
      .replace(/<title>[\s\S]*?<\/title>/i, '')
      .replace(/<meta\s+(?:name="description"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>\s*/gi, '')
      .replace('</head>', `${meta}\n  </head>`)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', found ? 'public, max-age=60, s-maxage=600' : 'no-store')
    return res.status(200).send(html)
  } catch (err) {
    console.error(err)
    // si algo falla, redirigimos a la app: el ramo se carga igual por el cliente
    res.setHeader('Location', `/#/`)
    return res.status(302).end()
  }
}
