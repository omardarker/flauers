// Generadores 3D procedurales de cada flor del catálogo.
// Cada builder recibe { hex, seed } y devuelve un THREE.Group con la cabeza
// de la flor centrada en el origen, mirando hacia +Y.
// group.userData.radius ≈ radio de la cabeza (para espaciar el ramo).

import * as THREE from 'three'
import { makePetal, whorl, paint, shade, meshOf, dots, transformed, rng, mergeGeometries } from './petals.js'

const GREEN = '#5e7d4f'
const GREEN_LIGHT = '#8aa66f'

function group(children, radius, extra = {}) {
  const g = new THREE.Group()
  children.forEach((c) => c && g.add(c))
  g.userData = { radius, ...extra }
  return g
}

function sepals({ n = 5, len = 0.32, width = 0.12, tilt = 1.3, y0 = -0.06, r0 = 0.05, seed }) {
  return whorl(
    (i) =>
      makePetal({
        length: len,
        width,
        bend: 0.4,
        cup: 0.2,
        pointy: 1.2,
        tipStart: 0.5,
        colorBase: GREEN,
        colorTip: GREEN_LIGHT,
        nx: 4,
        ny: 6,
        seed: seed + i,
      }),
    { n, r0, y0, tilt, seed: seed + 3 },
  )
}

function calyx(radius, height, color = GREEN, y = -height / 2) {
  const g = new THREE.SphereGeometry(radius, 12, 8)
  g.scale(1, height / radius / 2, 1)
  g.translate(0, y, 0)
  return paint(g, color)
}

function fibonacciDisc(count, R, y = 0, bulge = 0) {
  const pts = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let k = 0; k < count; k++) {
    const r = R * Math.sqrt((k + 0.5) / count)
    const th = k * golden
    pts.push(new THREE.Vector3(r * Math.cos(th), y + bulge * (1 - (r / R) ** 2), r * Math.sin(th)))
  }
  return pts
}

// ---------------------------------------------------------------- Rosa
export function rose({ hex, seed = 1 }) {
  const base = shade(hex, -0.08, 0.05)
  const tip = shade(hex, 0.06)
  const edge = shade(hex, 0.12, -0.05)
  const layers = [
    { n: 3, r0: 0.0, len: 0.3, w: 0.2, tilt: -0.1, bend: 0.2, curl: 0.0, cup: 0.9, y0: 0.02, scale: 0.9 },
    { n: 5, r0: 0.03, len: 0.34, w: 0.28, tilt: 0.1, bend: 0.35, curl: 0.3, cup: 0.7, y0: 0.0 },
    { n: 7, r0: 0.07, len: 0.38, w: 0.34, tilt: 0.35, bend: 0.55, curl: 0.7, cup: 0.55, y0: -0.02 },
    { n: 9, r0: 0.12, len: 0.4, w: 0.38, tilt: 0.65, bend: 0.7, curl: 1.0, cup: 0.45, y0: -0.05 },
    { n: 11, r0: 0.17, len: 0.42, w: 0.4, tilt: 0.95, bend: 0.8, curl: 1.3, cup: 0.35, y0: -0.09 },
    { n: 12, r0: 0.22, len: 0.4, w: 0.42, tilt: 1.25, bend: 0.7, curl: 1.5, cup: 0.3, y0: -0.14 },
  ]
  const geoms = []
  layers.forEach((L, li) => {
    geoms.push(
      ...whorl(
        (i) =>
          makePetal({
            length: L.len,
            width: L.w,
            bend: L.bend,
            curl: L.curl,
            cup: L.cup,
            baseW: 0.35,
            mid: 0.55,
            tipStart: 0.72,
            ruffle: 0.01,
            colorBase: base,
            colorTip: tip,
            colorEdge: edge,
            seed: seed * 7 + li * 13 + i,
          }),
        { n: L.n, r0: L.r0, y0: L.y0, tilt: L.tilt, phase: li * 0.7, jitter: 0.12, scale: L.scale || 1, seed: seed + li },
      ),
    )
  })
  geoms.push(...sepals({ n: 5, seed, y0: -0.16, r0: 0.12, tilt: 1.35 }))
  geoms.push(calyx(0.13, 0.28, GREEN, -0.2))
  return group([meshOf(geoms)], 0.5)
}

// ---------------------------------------------------------------- Peonía
export function peony({ hex, seed = 2 }) {
  const base = shade(hex, -0.06, 0.04)
  const tip = shade(hex, 0.1, -0.05)
  const edge = shade(hex, 0.16, -0.1)
  const layers = [
    { n: 6, r0: 0.02, len: 0.3, w: 0.26, tilt: 0.15, bend: 0.4, curl: 0.5, cup: 0.6, y0: 0.02 },
    { n: 9, r0: 0.06, len: 0.38, w: 0.34, tilt: 0.4, bend: 0.5, curl: 0.6, cup: 0.5, y0: 0 },
    { n: 12, r0: 0.11, len: 0.45, w: 0.4, tilt: 0.7, bend: 0.55, curl: 0.7, cup: 0.4, y0: -0.03 },
    { n: 14, r0: 0.17, len: 0.5, w: 0.44, tilt: 1.0, bend: 0.5, curl: 0.9, cup: 0.35, y0: -0.07 },
    { n: 16, r0: 0.23, len: 0.52, w: 0.46, tilt: 1.3, bend: 0.4, curl: 1.0, cup: 0.3, y0: -0.12 },
  ]
  const geoms = []
  layers.forEach((L, li) => {
    geoms.push(
      ...whorl(
        (i) =>
          makePetal({
            length: L.len,
            width: L.w,
            bend: L.bend,
            curl: L.curl,
            cup: L.cup,
            ruffle: 0.035,
            ruffleFreq: 7,
            baseW: 0.4,
            mid: 0.5,
            tipStart: 0.65,
            colorBase: base,
            colorTip: tip,
            colorEdge: edge,
            seed: seed * 5 + li * 17 + i,
          }),
        { n: L.n, r0: L.r0, y0: L.y0, tilt: L.tilt, phase: li * 0.5, jitter: 0.18, seed: seed + li },
      ),
    )
  })
  // estambres amarillos en el centro
  const rand = rng(seed)
  const stamens = []
  for (let i = 0; i < 24; i++) {
    const th = rand() * Math.PI * 2
    const r = 0.02 + rand() * 0.07
    stamens.push(new THREE.Vector3(Math.cos(th) * r, 0.22 + rand() * 0.06, Math.sin(th) * r))
  }
  geoms.push(...sepals({ n: 5, seed, y0: -0.14, r0: 0.15, tilt: 1.4, len: 0.3, width: 0.16 }))
  geoms.push(calyx(0.15, 0.3, GREEN, -0.2))
  return group([meshOf(geoms), dots(stamens, 0.02, '#f0d060')], 0.62)
}

// ---------------------------------------------------------------- Tulipán
export function tulip({ hex, seed = 3 }) {
  const base = shade(hex, -0.12, 0.05, 0.01)
  const tip = shade(hex, 0.04)
  const edge = shade(hex, 0.1)
  const petal = (i) =>
    makePetal({
      length: 0.62,
      width: 0.4,
      bend: 0.25,
      curl: -0.35,
      cup: 0.75,
      baseW: 0.45,
      mid: 0.45,
      tipStart: 0.62,
      pointy: 0.9,
      colorBase: base,
      colorTip: tip,
      colorEdge: edge,
      seed: seed + i,
    })
  const geoms = [
    ...whorl(petal, { n: 3, r0: 0.08, y0: 0, tilt: 0.12, seed, jitter: 0.06 }),
    ...whorl(petal, { n: 3, r0: 0.1, y0: -0.01, tilt: 0.22, phase: Math.PI / 3, seed: seed + 1, jitter: 0.06 }),
  ]
  geoms.push(calyx(0.1, 0.22, GREEN_LIGHT, -0.08))
  // hoja larga típica del tulipán
  geoms.push(
    transformed(
      makePetal({ length: 0.9, width: 0.22, bend: 0.5, cup: 0.5, pointy: 1.3, tipStart: 0.4, colorBase: GREEN, colorTip: GREEN_LIGHT, nx: 4, ny: 8 }),
      { pos: [0.08, -0.55, 0.08], rot: [0.35, 0.8, 0] },
    ),
  )
  return group([meshOf(geoms)], 0.32)
}

// ---------------------------------------------------------------- Girasol
export function sunflower({ hex, seed = 4 }) {
  const base = shade(hex, -0.1, 0.1)
  const tip = shade(hex, 0.05)
  const petal = (i) =>
    makePetal({
      length: 0.62,
      width: 0.15,
      bend: 0.5,
      curl: 0.2,
      cup: 0.3,
      baseW: 0.55,
      mid: 0.35,
      tipStart: 0.6,
      pointy: 1.1,
      twist: 0.15,
      colorBase: base,
      colorTip: tip,
      nx: 5,
      ny: 10,
      seed: seed + i,
    })
  const geoms = [
    ...whorl(petal, { n: 24, r0: 0.4, y0: 0.02, tilt: 1.25, seed, jitter: 0.1 }),
    ...whorl(petal, { n: 24, r0: 0.4, y0: -0.02, tilt: 1.45, phase: Math.PI / 24, seed: seed + 1, jitter: 0.1, scale: 0.95 }),
  ]
  const disc = new THREE.SphereGeometry(0.45, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  disc.scale(1, 0.28, 1)
  geoms.push(paint(disc, '#3a2415'))
  const back = new THREE.CircleGeometry(0.46, 32)
  back.rotateX(Math.PI / 2)
  back.translate(0, -0.005, 0)
  geoms.push(paint(back, GREEN))
  geoms.push(...sepals({ n: 13, len: 0.3, width: 0.1, tilt: 1.5, y0: -0.02, r0: 0.38, seed }))
  const seeds = fibonacciDisc(260, 0.42, 0.06, 0.08)
  const seedDots = dots(seeds, 0.028, '#5a3a1e', { scaleFn: (i) => 0.6 + 0.4 * ((i * 7919) % 100) / 100 })
  return group([meshOf(geoms), seedDots], 0.95)
}

// ---------------------------------------------------------------- Margarita / Gerbera
function daisyLike({ hex, seed, petalsPerRing, rings, len, width, centerColor, centerR, tilt, innerRing, radius, centerDots }) {
  const base = shade(hex, -0.04, 0.02)
  const tip = shade(hex, 0.04)
  const geoms = []
  for (let r = 0; r < rings; r++) {
    geoms.push(
      ...whorl(
        (i) =>
          makePetal({
            length: len * (1 - r * 0.06),
            width,
            bend: 0.35 + r * 0.1,
            curl: 0.25,
            cup: 0.4,
            baseW: 0.6,
            mid: 0.3,
            tipStart: 0.75,
            colorBase: base,
            colorTip: tip,
            nx: 4,
            ny: 9,
            seed: seed + r * 31 + i,
          }),
        { n: petalsPerRing, r0: centerR * 0.85, y0: 0.03 - r * 0.03, tilt: tilt + r * 0.15, phase: (r * Math.PI) / petalsPerRing, seed: seed + r, jitter: 0.1 },
      ),
    )
  }
  if (innerRing) {
    geoms.push(
      ...whorl(
        (i) =>
          makePetal({ length: 0.16, width: 0.05, bend: 0.6, cup: 0.3, baseW: 0.6, colorBase: shade(hex, -0.15, 0.1), colorTip: base, nx: 3, ny: 5, seed: seed + i }),
        { n: 40, r0: centerR * 0.7, y0: 0.06, tilt: 0.9, seed: seed + 9, jitter: 0.2 },
      ),
    )
  }
  const center = new THREE.SphereGeometry(centerR, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2)
  center.scale(1, 0.45, 1)
  geoms.push(paint(center, centerColor))
  const back = new THREE.CircleGeometry(centerR * 1.02, 24)
  back.rotateX(Math.PI / 2)
  geoms.push(paint(back, GREEN))
  geoms.push(...sepals({ n: 9, len: 0.22, width: 0.08, tilt: 1.5, y0: -0.03, r0: centerR * 0.9, seed }))
  geoms.push(calyx(centerR * 0.9, 0.2, GREEN, -0.1))
  const pts = fibonacciDisc(centerDots.count, centerR * 0.9, centerR * 0.3, centerR * 0.2)
  return group([meshOf(geoms), dots(pts, centerDots.size, centerDots.color)], radius)
}

export function daisy({ hex, seed = 5 }) {
  return daisyLike({
    hex,
    seed,
    petalsPerRing: 22,
    rings: 2,
    len: 0.42,
    width: 0.09,
    centerColor: '#e6b52c',
    centerR: 0.14,
    tilt: 1.2,
    radius: 0.48,
    centerDots: { count: 70, size: 0.018, color: '#c9931c' },
  })
}

export function gerbera({ hex, seed = 6 }) {
  return daisyLike({
    hex,
    seed,
    petalsPerRing: 30,
    rings: 2,
    len: 0.5,
    width: 0.11,
    centerColor: '#3b2a2a',
    centerR: 0.17,
    tilt: 1.15,
    innerRing: true,
    radius: 0.58,
    centerDots: { count: 90, size: 0.02, color: '#5a3d3d' },
  })
}

// ---------------------------------------------------------------- Lirio
export function lily({ hex, seed = 7 }) {
  const base = shade(hex, -0.05, 0.1)
  const tip = shade(hex, 0.18, -0.15)
  const edge = shade(hex, 0.22, -0.2)
  const petal = (wide) => (i) =>
    makePetal({
      length: 0.85,
      width: wide ? 0.34 : 0.26,
      bend: 0.55,
      curl: 1.1,
      cup: 0.45,
      baseW: 0.3,
      mid: 0.5,
      tipStart: 0.55,
      pointy: 0.8,
      ruffle: 0.02,
      ruffleFreq: 6,
      colorBase: base,
      colorTip: tip,
      colorEdge: edge,
      nx: 6,
      ny: 14,
      seed: seed + i,
    })
  const geoms = [
    ...whorl(petal(true), { n: 3, r0: 0.04, y0: 0, tilt: 0.75, seed, jitter: 0.08 }),
    ...whorl(petal(false), { n: 3, r0: 0.04, y0: -0.01, tilt: 0.85, phase: Math.PI / 3, seed: seed + 1, jitter: 0.08 }),
  ]
  // estambres
  const rand = rng(seed)
  const anthers = []
  for (let i = 0; i < 6; i++) {
    const th = (i / 6) * Math.PI * 2 + rand() * 0.3
    const dir = new THREE.Vector3(Math.cos(th) * 0.28, 0.5, Math.sin(th) * 0.28)
    const fil = new THREE.CylinderGeometry(0.008, 0.008, dir.length(), 5, 1)
    fil.translate(0, dir.length() / 2, 0)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
    fil.applyQuaternion(q)
    geoms.push(paint(fil, '#e9dfc4'))
    anthers.push(dir)
  }
  const pistil = new THREE.CylinderGeometry(0.012, 0.012, 0.6, 5, 1)
  pistil.translate(0, 0.3, 0)
  geoms.push(paint(pistil, '#d8c7a4'))
  geoms.push(calyx(0.1, 0.24, GREEN_LIGHT, -0.1))
  const antherMesh = dots(anthers, 0.03, '#a2521f', { widthSeg: 6, heightSeg: 4 })
  antherMesh.geometry.scale(1, 1.8, 1)
  return group([meshOf(geoms), antherMesh], 0.7)
}

// ---------------------------------------------------------------- Orquídea
export function orchid({ hex, seed = 8 }) {
  const base = shade(hex, 0.02)
  const tip = shade(hex, 0.08, -0.05)
  const throat = shade(hex, -0.25, 0.2)
  const sepal = (i) =>
    makePetal({ length: 0.5, width: 0.24, bend: 0.2, cup: 0.15, baseW: 0.35, mid: 0.5, tipStart: 0.6, pointy: 0.9, colorBase: base, colorTip: tip, seed: seed + i })
  const petal = (i) =>
    makePetal({ length: 0.48, width: 0.42, bend: 0.25, cup: 0.12, ruffle: 0.015, baseW: 0.3, mid: 0.55, tipStart: 0.62, colorBase: base, colorTip: tip, seed: seed + 10 + i })
  const geoms = [
    ...whorl(sepal, { n: 3, r0: 0.03, y0: 0, tilt: 1.35, phase: Math.PI / 2, seed, jitter: 0.05 }),
    ...whorl(petal, { n: 2, r0: 0.03, y0: 0.02, tilt: 1.3, phase: Math.PI / 2 + Math.PI / 3 + 0.25, seed: seed + 1, jitter: 0.05 }),
  ]
  // labelo: pieza pequeña con garganta oscura
  const lip = makePetal({ length: 0.3, width: 0.22, bend: 1.4, curl: 0.6, cup: -0.5, baseW: 0.5, mid: 0.5, tipStart: 0.7, colorBase: throat, colorTip: shade(hex, -0.1, 0.15), colorEdge: base, edgeAmount: 0.5, seed })
  transformed(lip, { pos: [0, 0.03, 0.05], rot: [0.5, 0, 0] })
  geoms.push(lip)
  const lobe = (sign) =>
    transformed(
      makePetal({ length: 0.2, width: 0.14, bend: 0.8, cup: 0.4, colorBase: throat, colorTip: shade(hex, -0.05, 0.15), nx: 4, ny: 6, seed }),
      { pos: [sign * 0.05, 0.04, 0.03], rot: [0.4, sign * 0.9, 0] },
    )
  geoms.push(lobe(1), lobe(-1))
  const column = new THREE.SphereGeometry(0.045, 10, 8)
  column.scale(1, 1, 1.6)
  column.translate(0, 0.07, -0.02)
  geoms.push(paint(column, '#f2e6d8'))
  const col2 = new THREE.SphereGeometry(0.03, 8, 6)
  col2.translate(0, 0.075, 0.03)
  geoms.push(paint(col2, '#f0cf5a'))
  geoms.push(calyx(0.06, 0.14, GREEN_LIGHT, -0.05))
  return group([meshOf(geoms)], 0.5)
}

// ---------------------------------------------------------------- Clavel
export function carnation({ hex, seed = 9 }) {
  const base = shade(hex, -0.1, 0.05)
  const tip = shade(hex, 0.06)
  const edge = shade(hex, 0.15, -0.1)
  const geoms = []
  const layers = [
    { n: 6, r0: 0.01, tilt: 0.15, len: 0.24 },
    { n: 9, r0: 0.04, tilt: 0.4, len: 0.3 },
    { n: 12, r0: 0.08, tilt: 0.7, len: 0.34 },
    { n: 14, r0: 0.12, tilt: 1.0, len: 0.36 },
    { n: 15, r0: 0.15, tilt: 1.25, len: 0.34 },
  ]
  layers.forEach((L, li) => {
    geoms.push(
      ...whorl(
        (i) =>
          makePetal({
            length: L.len,
            width: 0.3,
            bend: 0.5,
            curl: 0.4,
            cup: 0.35,
            ruffle: 0.06,
            ruffleFreq: 14,
            baseW: 0.2,
            mid: 0.7,
            tipStart: 0.85,
            colorBase: base,
            colorTip: tip,
            colorEdge: edge,
            nx: 10,
            ny: 9,
            seed: seed * 3 + li * 11 + i,
          }),
        { n: L.n, r0: L.r0, y0: -li * 0.03, tilt: L.tilt, phase: li * 0.45, jitter: 0.25, seed: seed + li },
      ),
    )
  })
  const cal = new THREE.CylinderGeometry(0.12, 0.07, 0.3, 10, 1)
  cal.translate(0, -0.22, 0)
  geoms.push(paint(cal, GREEN_LIGHT))
  return group([meshOf(geoms)], 0.42)
}

// ---------------------------------------------------------------- Crisantemo
export function chrysanthemum({ hex, seed = 10 }) {
  const base = shade(hex, -0.08, 0.05)
  const tip = shade(hex, 0.08)
  const geoms = []
  const layers = 8
  for (let li = 0; li < layers; li++) {
    const t = li / (layers - 1)
    geoms.push(
      ...whorl(
        (i) =>
          makePetal({
            length: 0.22 + t * 0.3,
            width: 0.07 + t * 0.04,
            bend: -0.9 + t * 0.5,
            curl: -0.6,
            cup: 0.9,
            baseW: 0.7,
            mid: 0.4,
            tipStart: 0.8,
            colorBase: base,
            colorTip: tip,
            nx: 4,
            ny: 9,
            seed: seed + li * 23 + i,
          }),
        { n: 8 + li * 3, r0: 0.02 + t * 0.2, y0: 0.05 - t * 0.2, tilt: 0.1 + t * 1.4, phase: li * 0.37, jitter: 0.15, seed: seed + li },
      ),
    )
  }
  geoms.push(calyx(0.18, 0.28, GREEN, -0.2))
  return group([meshOf(geoms)], 0.55)
}

// ---------------------------------------------------------------- Lavanda
export function lavender({ hex, seed = 11 }) {
  const rand = rng(seed)
  const pts = []
  const tall = 0.75
  for (let k = 0; k < 9; k++) {
    const y = -0.1 + (k / 8) * tall
    const n = 6
    for (let i = 0; i < n; i++) {
      const th = (i / n) * Math.PI * 2 + k * 0.6 + rand() * 0.3
      const r = 0.045 + rand() * 0.015
      pts.push(new THREE.Vector3(Math.cos(th) * r, y + rand() * 0.02, Math.sin(th) * r))
    }
  }
  const florets = dots(pts, 0.035, hex, { widthSeg: 6, heightSeg: 5 })
  florets.geometry.scale(1, 1.7, 0.9)
  const tipC = shade(hex, 0.12, -0.05)
  const tipDots = dots([new THREE.Vector3(0, tall - 0.06, 0)], 0.04, tipC)
  const stem = new THREE.CylinderGeometry(0.014, 0.018, tall + 0.2, 6, 1)
  stem.translate(0, tall / 2 - 0.15, 0)
  paint(stem, '#7f9a6f')
  const leaves = whorl(
    (i) => makePetal({ length: 0.22, width: 0.04, bend: 0.5, cup: 0.3, pointy: 1, tipStart: 0.5, colorBase: '#8fa88a', colorTip: '#a8bca0', nx: 3, ny: 5, seed: seed + i }),
    { n: 4, r0: 0.02, y0: -0.2, tilt: 0.9, seed },
  )
  return group([meshOf([stem, ...leaves]), florets, tipDots], 0.2, { spike: true })
}

// ---------------------------------------------------------------- Hortensia
export function hydrangea({ hex, seed = 12 }) {
  const rand = rng(seed)
  const c1 = shade(hex, -0.05, 0.05)
  const c2 = shade(hex, 0.08, -0.05)
  const eye = shade(hex, -0.2, 0.15, 0.02)
  // un florecilla: 4 pétalos planos + centro
  const floretGeom = mergeGeometries([
    ...whorl(
      (i) => makePetal({ length: 0.13, width: 0.11, bend: 0.2, cup: 0.15, baseW: 0.3, mid: 0.6, tipStart: 0.6, colorBase: c1, colorTip: c2, nx: 4, ny: 5, seed: seed + i }),
      { n: 4, r0: 0.012, y0: 0, tilt: 1.35, seed },
    ),
    paint(new THREE.SphereGeometry(0.018, 6, 5), eye),
  ])
  const count = 70
  const mesh = new THREE.InstancedMesh(floretGeom, floretsMaterial(), count)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const up = new THREE.Vector3(0, 1, 0)
  const s = new THREE.Vector3()
  const R = 0.42
  for (let i = 0; i < count; i++) {
    // puntos en el hemisferio superior + parte del ecuador
    const u = rand()
    const phi = Math.acos(1 - u * 1.25)
    const th = rand() * Math.PI * 2
    const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th))
    const pos = dir.clone().multiplyScalar(R * (0.92 + rand() * 0.1))
    q.setFromUnitVectors(up, dir)
    const spin = new THREE.Quaternion().setFromAxisAngle(dir, rand() * Math.PI)
    q.premultiply(spin)
    const sc = 0.9 + rand() * 0.35
    s.set(sc, sc, sc)
    m.compose(pos, q, s)
    mesh.setMatrixAt(i, m)
  }
  mesh.instanceMatrix.needsUpdate = true
  mesh.castShadow = true
  const core = new THREE.SphereGeometry(R * 0.86, 16, 12)
  paint(core, shade(hex, -0.12, 0))
  const leaf = (sign) =>
    transformed(
      makePetal({ length: 0.5, width: 0.34, bend: 0.5, cup: 0.35, pointy: 1, tipStart: 0.55, ruffle: 0.02, colorBase: GREEN, colorTip: GREEN_LIGHT, nx: 5, ny: 8, seed }),
      { pos: [sign * 0.1, -0.35, 0.1], rot: [0.9, sign * 1.2, 0] },
    )
  return group([meshOf([core, leaf(1), leaf(-1)]), mesh], 0.62)
}

let _floretsMat
function floretsMaterial() {
  if (!_floretsMat) {
    _floretsMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8 })
  }
  return _floretsMat
}

// ---------------------------------------------------------------- Paniculata
export function gypsophila({ hex, seed = 13 }) {
  const rand = rng(seed)
  const geoms = []
  const pts = []
  const branches = 7
  for (let b = 0; b < branches; b++) {
    const th = (b / branches) * Math.PI * 2 + rand() * 0.5
    const lean = 0.35 + rand() * 0.4
    const len = 0.45 + rand() * 0.35
    const end = new THREE.Vector3(Math.cos(th) * lean * len, len * 0.85, Math.sin(th) * lean * len)
    const start = new THREE.Vector3(0, -0.3, 0)
    const dir = end.clone().sub(start)
    const stem = new THREE.CylinderGeometry(0.005, 0.009, dir.length(), 4, 1)
    stem.translate(0, dir.length() / 2, 0)
    stem.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()))
    stem.translate(start.x, start.y, start.z)
    geoms.push(paint(stem, '#8da57c'))
    // ramillete en la punta
    const n = 10 + Math.floor(rand() * 8)
    for (let i = 0; i < n; i++) {
      const off = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.3)
      const p = end.clone().add(off)
      pts.push(p)
      const twig = new THREE.CylinderGeometry(0.003, 0.003, off.length(), 3, 1)
      twig.translate(0, off.length() / 2, 0)
      twig.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), off.clone().normalize()))
      twig.translate(end.x, end.y, end.z)
      geoms.push(paint(twig, '#9fb58e'))
    }
  }
  const flowers = dots(pts, 0.03, hex, { widthSeg: 6, heightSeg: 5, scaleFn: (i) => 0.7 + ((i * 37) % 10) / 20 })
  return group([meshOf(geoms), flowers], 0.55, { filler: true })
}

// ---------------------------------------------------------------- Eucalipto
export function eucalyptus({ hex, seed = 14 }) {
  const rand = rng(seed)
  const geoms = []
  const H = 0.85
  const stem = new THREE.CylinderGeometry(0.01, 0.016, H + 0.3, 6, 1)
  stem.translate(0, H / 2 - 0.25, 0)
  geoms.push(paint(stem, '#8a7f66'))
  const c1 = shade(hex, -0.04)
  const c2 = shade(hex, 0.08, -0.05)
  const pairs = 6
  for (let k = 0; k < pairs; k++) {
    const y = -0.15 + (k / (pairs - 1)) * H
    const base = k * 1.1 + rand() * 0.4
    const size = 0.1 + (1 - k / pairs) * 0.06
    for (let side = 0; side < 2; side++) {
      const th = base + side * Math.PI
      const leaf = new THREE.CircleGeometry(size, 14)
      // ligera concavidad
      const pos = leaf.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const yy = pos.getY(i)
        pos.setZ(i, -(x * x + yy * yy) * 0.6 + (rand() - 0.5) * 0.004)
      }
      leaf.computeVertexNormals()
      leaf.rotateX(-Math.PI / 2 + 0.25)
      leaf.translate(0, 0, size * 0.9)
      leaf.rotateY(th)
      leaf.translate(0, y, 0)
      const colors = new Float32Array(pos.count * 3)
      for (let i = 0; i < pos.count; i++) {
        const c = i === 0 ? c1 : c2
        colors[i * 3] = c.r
        colors[i * 3 + 1] = c.g
        colors[i * 3 + 2] = c.b
      }
      leaf.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geoms.push(leaf)
    }
  }
  return group([meshOf(geoms)], 0.5, { filler: true, spike: true })
}


// ---------------------------------------------------------------- Begonia
// Begonia doble: capas de pétalos redondeados y ligeramente ondulados,
// más plana que una rosa y con el centro apretado.
export function begonia({ hex, seed = 15 }) {
  const base = shade(hex, -0.06, 0.06)
  const tip = shade(hex, 0.08, -0.04)
  const edge = shade(hex, 0.14, -0.08)
  const layers = [
    { n: 4, r0: 0.0, len: 0.16, w: 0.16, tilt: 0.1, bend: 0.5, cup: 0.8, y0: 0.04 },
    { n: 6, r0: 0.03, len: 0.22, w: 0.22, tilt: 0.45, bend: 0.45, cup: 0.5, y0: 0.02 },
    { n: 8, r0: 0.07, len: 0.28, w: 0.28, tilt: 0.85, bend: 0.4, cup: 0.35, y0: 0 },
    { n: 10, r0: 0.11, len: 0.32, w: 0.32, tilt: 1.15, bend: 0.35, cup: 0.25, y0: -0.03 },
    { n: 12, r0: 0.15, len: 0.34, w: 0.34, tilt: 1.4, bend: 0.3, cup: 0.2, y0: -0.06 },
  ]
  const geoms = []
  layers.forEach((L, li) => {
    geoms.push(
      ...whorl(
        (i) =>
          makePetal({
            length: L.len,
            width: L.w,
            bend: L.bend,
            curl: 0.2,
            cup: L.cup,
            ruffle: 0.02,
            ruffleFreq: 6,
            baseW: 0.45,
            mid: 0.45,
            tipStart: 0.55,
            colorBase: base,
            colorTip: tip,
            colorEdge: edge,
            nx: 7,
            ny: 9,
            seed: seed * 3 + li * 19 + i,
          }),
        { n: L.n, r0: L.r0, y0: L.y0, tilt: L.tilt, phase: li * 0.6, jitter: 0.15, seed: seed + li },
      ),
    )
  })
  geoms.push(calyx(0.12, 0.22, GREEN, -0.14))
  // hoja asimétrica típica de la begonia
  geoms.push(
    transformed(
      makePetal({ length: 0.5, width: 0.4, bend: 0.4, cup: 0.3, pointy: 1.2, tipStart: 0.5, twist: 0.25, colorBase: '#4d6b45', colorTip: '#6f8f63', nx: 6, ny: 8, seed }),
      { pos: [0.12, -0.3, 0.1], rot: [1.0, 1.1, 0] },
    ),
  )
  return group([meshOf(geoms)], 0.45)
}

// ---------------------------------------------------------------- Astromelia
// Alstroemeria: varias flores en embudo por tallo. Seis pétalos: los dos
// superiores internos con garganta amarilla y base más oscura (las "rayas").
export function alstroemeria({ hex, seed = 16 }) {
  const rand = rng(seed)
  const base = shade(hex, -0.02, 0.05)
  const tip = shade(hex, 0.06)
  const throat = '#e9d26a'
  const streak = shade(hex, -0.3, 0.1)
  const one = (k) => {
    const outer = (i) =>
      makePetal({ length: 0.42, width: 0.2, bend: 0.5, curl: 0.5, cup: 0.35, baseW: 0.3, mid: 0.6, tipStart: 0.7, pointy: 0.6, colorBase: base, colorTip: tip, nx: 5, ny: 10, seed: seed + k * 7 + i })
    const inner = (i) =>
      makePetal({ length: 0.44, width: 0.15, bend: 0.4, curl: 0.6, cup: 0.3, baseW: 0.25, mid: 0.65, tipStart: 0.7, pointy: 0.7, colorBase: throat, colorTip: i === 2 ? tip : streak, colorEdge: base, edgeAmount: 0.6, nx: 5, ny: 10, seed: seed + k * 7 + 3 + i })
    const geoms = [
      ...whorl(outer, { n: 3, r0: 0.03, y0: 0, tilt: 0.6, seed: seed + k, jitter: 0.08 }),
      ...whorl(inner, { n: 3, r0: 0.03, y0: 0.01, tilt: 0.5, phase: Math.PI / 3, seed: seed + k + 1, jitter: 0.08 }),
    ]
    // estambres
    for (let i = 0; i < 6; i++) {
      const th = (i / 6) * Math.PI * 2
      const dir = new THREE.Vector3(Math.cos(th) * 0.1, 0.34, Math.sin(th) * 0.1)
      const fil = new THREE.CylinderGeometry(0.005, 0.005, dir.length(), 4, 1)
      fil.translate(0, dir.length() / 2, 0)
      fil.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()))
      geoms.push(paint(fil, '#d9c9a6'))
      const anther = new THREE.SphereGeometry(0.014, 5, 4)
      anther.translate(dir.x, dir.y, dir.z)
      geoms.push(paint(anther, '#7a4a2e'))
    }
    geoms.push(calyx(0.05, 0.12, GREEN_LIGHT, -0.04))
    return geoms
  }
  // 3 flores en umbela: una central y dos inclinadas, cada una con su pedicelo
  const geoms = []
  const heads = [
    { dir: new THREE.Vector3(0, 1, 0), len: 0.25 },
    { dir: new THREE.Vector3(0.75, 0.75, 0.2).normalize(), len: 0.32 },
    { dir: new THREE.Vector3(-0.6, 0.7, -0.45).normalize(), len: 0.3 },
  ]
  heads.forEach((h, k) => {
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), h.dir)
    const pos = h.dir.clone().multiplyScalar(h.len)
    const rotY = rand() * Math.PI * 2
    one(k).forEach((g) => {
      g.rotateY(rotY)
      g.applyQuaternion(q)
      g.translate(pos.x, pos.y, pos.z)
      geoms.push(g)
    })
    const ped = new THREE.CylinderGeometry(0.012, 0.014, h.len, 5, 1)
    ped.translate(0, h.len / 2, 0)
    ped.applyQuaternion(q)
    geoms.push(paint(ped, GREEN_LIGHT))
  })
  // hojas lanceoladas en la base
  geoms.push(
    ...whorl(
      (i) => makePetal({ length: 0.4, width: 0.1, bend: 0.6, cup: 0.3, pointy: 1.2, tipStart: 0.45, colorBase: GREEN, colorTip: GREEN_LIGHT, nx: 3, ny: 6, seed: seed + i }),
      { n: 4, r0: 0.03, y0: -0.12, tilt: 1.1, seed: seed + 5 },
    ),
  )
  return group([meshOf(geoms)], 0.55)
}

export const BUILDERS = {
  rose,
  peony,
  tulip,
  sunflower,
  daisy,
  gerbera,
  lily,
  orchid,
  carnation,
  chrysanthemum,
  lavender,
  hydrangea,
  gypsophila,
  eucalyptus,
  begonia,
  alstroemeria,
}

export function buildFlower(model, opts) {
  const fn = BUILDERS[model]
  if (!fn) throw new Error(`Modelo 3D desconocido: ${model}`)
  return fn(opts)
}
