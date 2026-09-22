// Función serverless de Vercel: guarda y recupera ramos para los links cortos.
//   POST /api/bouquets        body: { bouquet compacto }  →  { id }
//   GET  /api/bouquets?id=X                               →  { bouquet compacto }
// Almacenamiento: Redis (Upstash) a través de la integración de Vercel.

import { Redis } from '@upstash/redis'
import { randomBytes } from 'node:crypto'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789' // sin 0/O/1/l/I
const MAX_BODY = 6000
const MAX_STEMS = 40

// Acepta cualquier prefijo que ponga la integración de Vercel
// (KV_REST_API_URL, STORAGE_REST_API_URL, UPSTASH_REDIS_REST_URL, ...).
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

function newId(len = 7) {
  const bytes = randomBytes(len)
  let id = ''
  for (let i = 0; i < len; i++) id += ALPHABET[bytes[i] % ALPHABET.length]
  return id
}

// Valida y normaliza el ramo compacto (mismo formato que viaja en el hash).
function sanitize(c) {
  if (!c || typeof c !== 'object' || !Array.isArray(c.i)) return null
  const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : undefined)
  const items = c.i
    .filter((r) => Array.isArray(r) && r.length === 3 && typeof r[0] === 'string' && typeof r[1] === 'string')
    .map(([f, col, q]) => [f.slice(0, 32), col.slice(0, 32), Math.max(1, Math.min(MAX_STEMS, Number(q) || 1))])
    .slice(0, 20)
  if (!items.length) return null
  const layout = Array.isArray(c.l)
    ? c.l
        .filter((r) => Array.isArray(r) && r.length === 4 && typeof r[0] === 'string' && r.slice(1).every((v) => typeof v === 'number' && Number.isFinite(v)))
        .map(([k, x, y, z]) => [k.slice(0, 40), +x.toFixed(2), +y.toFixed(2), +z.toFixed(2)])
        .slice(0, 100)
    : undefined
  return {
    v: 1,
    i: items,
    w: str(c.w, 24),
    r: str(c.r, 24),
    t: str(c.t, 40),
    f: str(c.f, 40),
    m: str(c.m, 240),
    l: layout && layout.length ? layout : undefined,
    o: typeof c.o === 'number' && Number.isFinite(c.o) ? Math.max(0, Math.min(100, Math.round(c.o))) : undefined,
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()

  const db = redis()
  if (!db) return res.status(503).json({ error: 'storage_not_configured' })

  try {
    if (req.method === 'GET') {
      const id = String(req.query?.id || '')
      if (!/^[A-Za-z0-9]{4,16}$/.test(id)) return res.status(400).json({ error: 'bad_id' })
      const data = await db.get(`bouquet:${id}`)
      if (!data) return res.status(404).json({ error: 'not_found' })
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      return res.status(200).json({ bouquet: data })
    }

    if (req.method === 'POST') {
      let body = req.body
      if (typeof body === 'string') {
        if (body.length > MAX_BODY) return res.status(413).json({ error: 'too_large' })
        body = JSON.parse(body)
      }
      if (JSON.stringify(body || {}).length > MAX_BODY) return res.status(413).json({ error: 'too_large' })
      const clean = sanitize(body)
      if (!clean) return res.status(400).json({ error: 'bad_bouquet' })
      let id = newId()
      // evita colisiones (muy improbables) reintentando
      for (let tries = 0; tries < 5; tries++) {
        const ok = await db.set(`bouquet:${id}`, clean, { nx: true })
        if (ok) return res.status(201).json({ id })
        id = newId()
      }
      return res.status(500).json({ error: 'id_collision' })
    }

    res.setHeader('Allow', 'GET, POST, OPTIONS')
    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'server_error' })
  }
}
