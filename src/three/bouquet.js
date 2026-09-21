// Armado del ramo: distribuye las flores en espiral, genera tallos, papel y lazo.

import * as THREE from 'three'
import { FLOWER_BY_ID, findColor } from '../data/flowers.js'
import { WRAPS, RIBBONS } from '../data/bouquets.js'
import { buildFlower } from './flowers.js'
import { paint, petalMaterial, rng, hashString, meshOf, makePetal, transformed, shade } from './petals.js'

const BIND_Y = -2.1 // altura del lazo
const STEM_END_Y = -3.0 // extremo inferior de los tallos
const UP = new THREE.Vector3(0, 1, 0)

// Expande {flower, color, qty} a una lista de flores individuales.
export function expandItems(items) {
  const list = []
  items.forEach((it) => {
    const def = FLOWER_BY_ID[it.flower]
    if (!def) return
    const color = findColor(def, it.color)
    for (let i = 0; i < Math.max(0, Math.min(it.qty, 40)); i++) {
      list.push({ def, color, index: i })
    }
  })
  return list
}

export function bouquetSeed(bouquet) {
  return hashString(bouquet.items.map((i) => `${i.flower}:${i.color}:${i.qty}`).join('|'))
}

/**
 * Construye el grupo 3D completo del ramo.
 * @param {object} bouquet {items, wrap, ribbon}
 * @param {object} opts {wrap: boolean}
 */
export function buildBouquet(bouquet, opts = {}) {
  const root = new THREE.Group()
  const list = expandItems(bouquet.items)
  if (list.length === 0) return root

  const seed = bouquetSeed(bouquet)
  const rand = rng(seed)

  // Orden: focales grandes al centro, luego el resto, rellenos al final pero
  // intercalados para que no queden todos en el borde.
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

  const n = ordered.length
  const avgR = mains.length ? mains.reduce((s, f) => s + sizeOf(f.def), 0) / mains.length : 0.45
  const spacing = avgR * 2 * 0.82
  const c = spacing / 1.77
  const golden = Math.PI * (3 - Math.sqrt(5))
  const focal = new THREE.Vector3(0, BIND_Y - 1.4, 0) // punto del que "irradian" las flores
  const outerR = c * Math.sqrt(Math.max(1, n - 1))

  const stems = []
  const heads = []
  ordered.forEach((f, k) => {
    const r = c * Math.sqrt(k) * (1 + (rand() - 0.5) * 0.12)
    const th = k * golden + (rand() - 0.5) * 0.25
    const isSpike = false
    const dome = n > 1 ? (r / outerR) ** 2 : 0
    let y = 0.15 - dome * (0.35 + outerR * 0.28)
    let pr = r
    if (f.def.filler) {
      y += f.def.model === 'gypsophila' ? 0.2 : -0.05
      pr = r * 1.06
    }
    const pos = new THREE.Vector3(Math.cos(th) * pr, y, Math.sin(th) * pr)
    const up = pos.clone().sub(focal).normalize()
    const head = buildFlower(f.def.model, { hex: f.color.hex, seed: seed + k * 101 + f.index })
    const sc = sizeScale(f.def) * (1 + (rand() - 0.5) * 0.1)
    head.scale.setScalar(sc)
    head.quaternion.setFromUnitVectors(UP, up)
    head.rotateY(rand() * Math.PI * 2)
    head.position.copy(pos)
    root.add(head)
    heads.push(head)
    stems.push(makeStem(pos, up, rand, k, isSpike))
  })

  const stemMesh = meshOf(stems)
  stemMesh.castShadow = true
  root.add(stemMesh)

  if (opts.wrap !== false) {
    const wrap = WRAPS.find((w) => w.id === bouquet.wrap) || WRAPS[0]
    const ribbon = RIBBONS.find((r) => r.id === bouquet.ribbon) || RIBBONS[0]
    const paper = makeWrap(outerR + avgR * 0.55, wrap.hex, seed)
    root.add(paper)
    root.add(makeRibbon(ribbon.hex, seed, paper.userData.radiusAtBind))
  }

  root.userData.radius = outerR + avgR
  return root
}

function sizeOf(def) {
  return SIZE[def.model] || 0.5
}

const SIZE = {
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
}

function sizeScale() {
  return 1
}

// Tallo: curva desde el extremo inferior, pasa por el lazo y llega a la cabeza
// siguiendo la orientación de la flor.
function makeStem(head, up, rand, k, spike) {
  const bind = new THREE.Vector3((rand() - 0.5) * 0.35, BIND_Y, (rand() - 0.5) * 0.35)
  const ctrl = head.clone().sub(up.clone().multiplyScalar(head.distanceTo(bind) * 0.55))
  const end = new THREE.Vector3(bind.x + (rand() - 0.5) * 0.4, STEM_END_Y + rand() * 0.25, bind.z + (rand() - 0.5) * 0.4)
  const curve = new THREE.CatmullRomCurve3([end, bind, ctrl, head.clone().sub(up.clone().multiplyScalar(0.08))], false, 'catmullrom', 0.2)
  const geom = new THREE.TubeGeometry(curve, 24, 0.024 + rand() * 0.01, 6, false)
  const g = shade('#6b8a55', (rand() - 0.5) * 0.08, 0)
  paint(geom, g)
  const parts = [geom]
  // hoja ocasional
  if (rand() < 0.45) {
    const t = 0.55 + rand() * 0.25
    const p = curve.getPointAt(t)
    const leaf = makePetal({ length: 0.42, width: 0.16, bend: 0.7, cup: 0.4, pointy: 1.1, tipStart: 0.5, colorBase: '#5f7d4c', colorTip: '#89a86c', nx: 4, ny: 7, seed: k })
    transformed(leaf, { pos: [p.x, p.y, p.z], rot: [0.6 + rand() * 0.4, rand() * Math.PI * 2, 0] })
    parts.push(leaf)
  }
  return parts.length === 1 ? parts[0] : mergeParts(parts)
}

function mergeParts(parts) {
  return meshOf(parts).geometry
}

// Papel de envolver: superficie paramétrica en forma de cono abierto con
// bordes irregulares, como papel doblado a mano.
function makeWrap(topRadius, hex, seed) {
  const rand = rng(seed + 77)
  const phase1 = rand() * Math.PI * 2
  const phase2 = rand() * Math.PI * 2
  const nu = 96
  const nv = 14
  const y0 = BIND_Y - 0.25
  const y1 = -0.7
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
        const yy = y0 + (y1 * yMul + topWave - y0) * v
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
  g.add(build(1.0, 1.0, hex, 0))
  g.add(build(0.88, 1.12, shade(hex, 0.12, -0.05).getStyle(), 2.1))
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
  band.scale.y = 1
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
