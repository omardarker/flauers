// Armado del ramo: distribuye las flores en espiral evitando que se crucen,
// respeta las posiciones que el usuario fijó arrastrando, y genera tallos,
// papel y lazo.

import * as THREE from 'three'
import { FLOWER_BY_ID, findColor } from '../data/flowers.js'
import { WRAPS, RIBBONS } from '../data/bouquets.js'
import { buildFlower } from './flowers.js'
import { paint, petalMaterial, rng, hashString, makePetal, transformed, shade } from './petals.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export const BIND_Y = -2.1 // altura del lazo
const STEM_END_Y = -3.0 // extremo inferior de los tallos
const UP = new THREE.Vector3(0, 1, 0)
export const FOCAL = new THREE.Vector3(0, BIND_Y - 1.4, 0) // punto del que "irradian" las flores

// Radio aproximado de cada cabeza (para el espaciado y las colisiones).
export const SIZE = {
  rose: 0.5,
  peony: 0.62,
  tulip: 0.34,
  sunflower: 0.85,
  daisy: 0.42,
  gerbera: 0.55,
  lily: 0.66,
  orchid: 0.48,
  carnation: 0.42,
  chrysanthemum: 0.55,
  lavender: 0.25,
  hydrangea: 0.62,
  gypsophila: 0.5,
  eucalyptus: 0.45,
  begonia: 0.45,
  alstroemeria: 0.55,
}

function sizeOf(def) {
  return SIZE[def.model] || 0.5
}

// Expande {flower, color, qty} a una lista de flores individuales.
export function expandItems(items) {
  const list = []
  items.forEach((it) => {
    const def = FLOWER_BY_ID[it.flower]
    if (!def) return
    const color = findColor(def, it.color)
    for (let i = 0; i < Math.max(0, Math.min(it.qty, 40)); i++) {
      list.push({ def, color, index: i, key: `${def.id}:${i}` })
    }
  })
  return list
}

export function bouquetSeed(bouquet) {
  return hashString(bouquet.items.map((i) => `${i.flower}:${i.color}:${i.qty}`).join('|'))
}

/** Altura de una cabeza según su distancia al centro (cúpula del ramo). */
export function domeY(r, R, def) {
  const dome = R > 0 ? Math.min(1.5, (r / R) ** 2) : 0
  let y = 0.15 - dome * (0.35 + R * 0.28)
  if (def?.filler) y += def.model === 'gypsophila' ? 0.2 : -0.05
  return y
}

function validPos(p) {
  return Array.isArray(p) && p.length === 3 && p.every((v) => Number.isFinite(v))
}

/**
 * Calcula la posición de cada tallo.
 * Las flores con posición fijada por el usuario (bouquet.layout) no se mueven;
 * el resto se acomoda en espiral y se separa para no cruzarse.
 */
export function layoutBouquet(bouquet) {
  const list = expandItems(bouquet.items)
  const seed = bouquetSeed(bouquet)
  const rand = rng(seed)
  if (!list.length) return { slots: [], R: 0, avgR: 0.45, seed }

  // Orden: focales grandes al centro, rellenos intercalados.
  const mains = list.filter((f) => !f.def.filler)
  const fillers = list.filter((f) => f.def.filler)
  mains.sort((a, b) => sizeOf(b.def) - sizeOf(a.def))
  const ordered = []
  const fillerEvery = fillers.length ? Math.max(2, Math.floor((mains.length + fillers.length) / fillers.length)) : Infinity
  let fi = 0
  for (let i = 0; i < mains.length + fillers.length; i++) {
    if (fi < fillers.length && i > 0 && i % fillerEvery === 0) ordered.push(fillers[fi++])
    else if (ordered.length - fi < mains.length) ordered.push(mains[ordered.length - fi])
    else ordered.push(fillers[fi++])
  }

  const avgR = mains.length ? mains.reduce((s, f) => s + sizeOf(f.def), 0) / mains.length : 0.45
  const c = (avgR * 2 * 0.82) / 1.77
  const golden = Math.PI * (3 - Math.sqrt(5))
  const layout = bouquet.layout || {}

  const slots = ordered.map((f, k) => {
    const r = c * Math.sqrt(k) * (1 + (rand() - 0.5) * 0.12)
    const th = k * golden + (rand() - 0.5) * 0.25
    const rot = rand() * Math.PI * 2
    const scale = 1 + (rand() - 0.5) * 0.1
    const fixedPos = validPos(layout[f.key]) ? layout[f.key] : null
    return {
      f,
      key: f.key,
      radius: sizeOf(f.def),
      fixed: !!fixedPos,
      x: fixedPos ? fixedPos[0] : Math.cos(th) * r,
      y: fixedPos ? fixedPos[1] : 0,
      z: fixedPos ? fixedPos[2] : Math.sin(th) * r,
      k,
      rot,
      scale,
    }
  })

  relax(slots, rand)

  const R = Math.max(0.5, ...slots.map((s) => Math.hypot(s.x, s.z)))
  slots.forEach((s) => {
    if (!s.fixed) s.y = domeY(Math.hypot(s.x, s.z), R, s.f.def)
  })
  return { slots, R, avgR, seed }
}

// Separa las cabezas que se solapan (solo mueve las que no fijó el usuario).
function relax(slots, rand) {
  const n = slots.length
  for (let it = 0; it < 60; it++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = slots[i]
        const b = slots[j]
        if (a.fixed && b.fixed) continue
        let dx = b.x - a.x
        let dz = b.z - a.z
        let d = Math.hypot(dx, dz)
        const filler = a.f.def.filler || b.f.def.filler
        const minD = (a.radius + b.radius) * (filler ? 0.42 : 0.66)
        if (d >= minD) continue
        if (d < 1e-4) {
          const ang = rand() * Math.PI * 2
          dx = Math.cos(ang) * 1e-3
          dz = Math.sin(ang) * 1e-3
          d = 1e-3
        }
        const push = (minD - d) * 0.5
        const ux = dx / d
        const uz = dz / d
        if (a.fixed) {
          b.x += ux * push * 2
          b.z += uz * push * 2
        } else if (b.fixed) {
          a.x -= ux * push * 2
          a.z -= uz * push * 2
        } else {
          a.x -= ux * push
          a.z -= uz * push
          b.x += ux * push
          b.z += uz * push
        }
      }
    }
    // leve atracción al centro para mantener el ramo compacto
    for (const s of slots) {
      if (!s.fixed) {
        s.x *= 0.995
        s.z *= 0.995
      }
    }
  }
}

/**
 * Construye el grupo 3D completo del ramo.
 * root.userData.flowers: grupos por tallo (cabeza + tallo + hitbox) para el arrastre.
 */
export function buildBouquet(bouquet, opts = {}) {
  const root = new THREE.Group()
  const { slots, R, avgR, seed } = layoutBouquet(bouquet)
  root.userData = { radius: 1, R, avgR, flowers: [] }
  if (slots.length === 0) return root

  const rand = rng(seed + 5)
  slots.forEach((s) => {
    const fg = new THREE.Group()
    const head = buildFlower(s.f.def.model, { hex: s.f.color.hex, seed: seed + s.k * 101 + s.f.index })
    head.scale.setScalar(s.scale)
    fg.add(head)

    const stem = new THREE.Mesh(new THREE.BufferGeometry(), petalMaterial())
    stem.castShadow = true
    fg.add(stem)

    const hit = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ visible: false }))
    hit.visible = false
    hit.userData.owner = fg
    fg.add(hit)

    fg.userData = {
      key: s.key,
      def: s.f.def,
      radius: s.radius,
      head,
      stem,
      hit,
      rot: s.rot,
      stemParams: stemParams(rand, s.k),
      lift: s.fixed ? s.y - domeY(Math.hypot(s.x, s.z), R, s.f.def) : 0,
    }
    placeFlower(fg, new THREE.Vector3(s.x, s.y, s.z))
    root.add(fg)
    root.userData.flowers.push(fg)
  })

  root.userData.seed = seed
  if (opts.wrap !== false) {
    const wrapGroup = buildWrapGroup(bouquet, R, avgR, seed)
    root.add(wrapGroup)
    root.userData.wrapGroup = wrapGroup
  }

  root.userData.radius = R + avgR
  return root
}

// Apertura del papel: 0 = cerrado, 100 = muy abierto. Sin valor → automático.
const WRAP_MIN = 0.7
const WRAP_SPAN = 1.9

// Altura del borde del papel: 0 = bajo, 100 = alto (cubre las flores).
const WRAP_Y_MIN = -1.2
const WRAP_Y_SPAN = 2.0
const WRAP_Y_AUTO = -0.7

export function wrapTopFor(height) {
  if (height === undefined || height === null || !Number.isFinite(height)) return WRAP_Y_AUTO
  return WRAP_Y_MIN + (THREE.MathUtils.clamp(height, 0, 100) / 100) * WRAP_Y_SPAN
}

export const AUTO_WRAP_HEIGHT = Math.round(((WRAP_Y_AUTO - WRAP_Y_MIN) / WRAP_Y_SPAN) * 100)

export function wrapRadiusFor(open, R, avgR) {
  if (open === undefined || open === null || !Number.isFinite(open)) return R + avgR * 0.55
  return WRAP_MIN + (THREE.MathUtils.clamp(open, 0, 100) / 100) * WRAP_SPAN
}

/** Valor del deslizador equivalente al tamaño automático del papel. */
export function autoWrapOpenFor(bouquet) {
  const { R, avgR } = layoutBouquet(bouquet)
  return Math.round(THREE.MathUtils.clamp(((R + avgR * 0.55 - WRAP_MIN) / WRAP_SPAN) * 100, 0, 100))
}

export function buildWrapGroup(bouquet, R, avgR, seed) {
  const wrap = WRAPS.find((w) => w.id === bouquet.wrap) || WRAPS[0]
  const ribbon = RIBBONS.find((r) => r.id === bouquet.ribbon) || RIBBONS[0]
  const g = new THREE.Group()
  const paper = makeWrap(wrapRadiusFor(bouquet.wrapOpen, R, avgR), wrap.hex, seed, wrapTopFor(bouquet.wrapHeight))
  g.add(paper)
  g.add(makeRibbon(ribbon.hex, seed, paper.userData.radiusAtBind))
  return g
}

/** Reemplaza solo el papel y el lazo de un ramo ya construido. */
export function updateWrap(root, bouquet) {
  const old = root.userData.wrapGroup
  if (old) {
    root.remove(old)
    disposeGroup(old)
  }
  const g = buildWrapGroup(bouquet, root.userData.R, root.userData.avgR, root.userData.seed)
  root.add(g)
  root.userData.wrapGroup = g
}

/** Coloca una flor (cabeza orientada desde el foco) y regenera su tallo. */
export function placeFlower(fg, pos) {
  const { head, stem, hit, rot, stemParams, radius } = fg.userData
  const up = pos.clone().sub(FOCAL).normalize()
  head.position.copy(pos)
  head.quaternion.setFromUnitVectors(UP, up)
  head.rotateY(rot)
  const old = stem.geometry
  stem.geometry = stemGeometry(pos, up, stemParams)
  old.dispose()
  const hr = Math.max(0.3, radius * (fg.userData.def.filler ? 0.6 : 0.85))
  hit.scale.setScalar(hr)
  hit.position.copy(pos).addScaledVector(up, radius * 0.15)
}

function stemParams(rand, k) {
  const p = {
    bindX: (rand() - 0.5) * 0.35,
    bindZ: (rand() - 0.5) * 0.35,
    endX: (rand() - 0.5) * 0.4,
    endY: STEM_END_Y + rand() * 0.25,
    endZ: (rand() - 0.5) * 0.4,
    radius: 0.024 + rand() * 0.01,
    color: shade('#6b8a55', (rand() - 0.5) * 0.08, 0),
    leaf: null,
  }
  if (rand() < 0.45) p.leaf = { t: 0.55 + rand() * 0.25, rx: 0.6 + rand() * 0.4, ry: rand() * Math.PI * 2, seed: k }
  return p
}

// Tallo: curva desde el extremo inferior, pasa por el lazo y llega a la cabeza
// siguiendo la orientación de la flor.
function stemGeometry(head, up, p) {
  const bind = new THREE.Vector3(p.bindX, BIND_Y, p.bindZ)
  const ctrl = head.clone().sub(up.clone().multiplyScalar(head.distanceTo(bind) * 0.55))
  const end = new THREE.Vector3(bind.x + p.endX, p.endY, bind.z + p.endZ)
  const curve = new THREE.CatmullRomCurve3([end, bind, ctrl, head.clone().sub(up.clone().multiplyScalar(0.08))], false, 'catmullrom', 0.2)
  const geom = new THREE.TubeGeometry(curve, 24, p.radius, 6, false)
  paint(geom, p.color)
  if (!p.leaf) return geom
  const pt = curve.getPointAt(p.leaf.t)
  const leaf = makePetal({ length: 0.42, width: 0.16, bend: 0.7, cup: 0.4, pointy: 1.1, tipStart: 0.5, colorBase: '#5f7d4c', colorTip: '#89a86c', nx: 4, ny: 7, seed: p.leaf.seed })
  transformed(leaf, { pos: [pt.x, pt.y, pt.z], rot: [p.leaf.rx, p.leaf.ry, 0] })
  const merged = mergeGeometries([geom, leaf], false)
  geom.dispose()
  leaf.dispose()
  return merged
}


// Papel de envolver: superficie paramétrica en forma de cono abierto con
// bordes irregulares, como papel doblado a mano.
function makeWrap(topRadius, hex, seed, topY = -0.7) {
  const rand = rng(seed + 77)
  const phase1 = rand() * Math.PI * 2
  const phase2 = rand() * Math.PI * 2
  const nu = 96
  const nv = 14
  const y0 = BIND_Y - 0.25
  const y1 = topY
  const r0 = 0.3
  const build = (rMul, yMul, colorHex, seedOff) => {
    const positions = []
    const uvs = []
    const idx = []
    for (let j = 0; j <= nv; j++) {
      const v = j / nv
      for (let i = 0; i <= nu; i++) {
        const u = i / nu
        const th = u * Math.PI * 2
        const flare = Math.pow(v, 1.15)
        const edge = 1 + 0.045 * Math.sin(6 * th + phase1 + seedOff) + 0.03 * Math.sin(11 * th + phase2)
        const rr = (r0 + (topRadius * rMul - r0) * flare) * (v > 0.05 ? edge : 1)
        // más alto por detrás (z negativo) y con borde irregular
        const topWave = 0.55 * -Math.sin(th) + 0.12 * Math.sin(3 * th + phase1) + 0.08 * Math.sin(7 * th + phase2)
        const yy = y0 + (y1 + yMul + topWave - y0) * v
        positions.push(Math.cos(th) * rr, yy, Math.sin(th) * rr)
        uvs.push(u, v)
      }
    }
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const a = j * (nu + 1) + i
        const b = a + nu + 1
        idx.push(a, a + 1, b, a + 1, b + 1, b)
      }
    }
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geom.setIndex(idx)
    geom.computeVertexNormals()
    const mat = new THREE.MeshStandardMaterial({ color: colorHex, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 })
    const mesh = new THREE.Mesh(geom, mat)
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }
  const g = new THREE.Group()
  g.add(build(1.0, 0, hex, 0))
  g.add(build(0.88, -0.1, shade(hex, 0.12, -0.05).getStyle(), 2.1))
  // radio del papel a la altura del lazo, para que el lazo quede por fuera
  const vBind = (BIND_Y - y0) / (y1 - y0)
  g.userData.radiusAtBind = (r0 + (topRadius - r0) * Math.pow(vBind, 1.15)) * 1.05
  return g
}

function makeRibbon(hex, seed, radius = 0.4) {
  const rand = rng(seed + 99)
  const R = Math.max(0.36, radius)
  const mat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide })
  const g = new THREE.Group()
  const band = new THREE.Mesh(new THREE.TorusGeometry(R, 0.07, 10, 48), mat)
  band.rotation.x = Math.PI / 2
  band.position.y = BIND_Y
  band.castShadow = true
  g.add(band)
  // lazo: dos bucles y dos colas
  const loop = (sign) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 24), mat)
    t.scale.set(1.3, 0.8, 1)
    t.position.set(sign * 0.2, BIND_Y + 0.02, R + 0.02)
    t.rotation.z = sign * 0.35
    t.castShadow = true
    return t
  }
  g.add(loop(1), loop(-1))
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat)
  knot.position.set(0, BIND_Y, R + 0.05)
  g.add(knot)
  const tail = (sign) => {
    const len = 0.6 + rand() * 0.2
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.09, len, 0.012), mat)
    t.position.set(sign * 0.09, BIND_Y - len / 2 - 0.02, R + 0.06)
    t.rotation.z = sign * 0.25
    t.rotation.x = 0.1
    t.castShadow = true
    return t
  }
  g.add(tail(1), tail(-1))
  return g
}

/** Libera memoria de un grupo (geometrías y materiales propios). */
export function disposeGroup(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose()
    if (o.material && o.material !== petalMaterial() && !o.material.userData?.shared) {
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose())
      else o.material.dispose()
    }
  })
}
