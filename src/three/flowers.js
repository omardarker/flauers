// Generadores 3D procedurales de cada flor del catálogo.
// Cada builder recibe { hex, seed } y devuelve un THREE.Group con la cabeza
// de la flor centrada en el origen, mirando hacia +Y.
// group.userData.radius ≈ radio de la cabeza (para espaciar el ramo).

import * as THREE from 'three'
import { makePetal, makeCupPetal, whorl, spiral, paint, shade, meshOf, dots, transformed, rng, mergeGeometries, petalMaterial } from './petals.js'

const GREEN = '#5e7d4f'
const GREEN_LIGHT = '#8aa66f'

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

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

// Núcleo ovoide del color de la flor bajo el centro de pétalos.
function core(radius, height, color, y) {
  const g = new THREE.SphereGeometry(radius, 12, 10)
  g.scale(1, height / radius / 2, 1)
  g.translate(0, y, 0)
  return paint(g, color)
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
// Rosa híbrida de té abierta: capullo enrollado en el centro que sube en cono,
// espiral de pétalos anchos y acopados, y los exteriores reflejados hacia atrás.
export function rose({ hex, seed = 1 }) {
  const base = shade(hex, -0.1, 0.06)
  const tip = shade(hex, 0.05)
  const edge = shade(hex, 0.13, -0.06)
  const geoms = []
  // centro enrollado
  geoms.push(
    ...spiral(
      (i, t) =>
        makePetal({
          length: 0.3 + t * 0.08,
          width: 0.26 + t * 0.1,
          bend: -0.25 + t * 0.35,
          curl: 0.1,
          cup: 1.3 - t * 0.5,
          baseW: 0.5,
          mid: 0.5,
          tipStart: 0.8,
          colorBase: base,
          colorTip: tip,
          colorEdge: edge,
          seed: seed * 7 + i,
        }),
      { n: 7, r0: [0.0, 0.04], y0: [0.2, 0.14], tilt: [-0.05, 0.25], scale: [0.85, 1], seed, jitter: 0.06 },
    ),
  )
  // espiral principal
  geoms.push(
    ...spiral(
      (i, t) =>
        makePetal({
          length: 0.42,
          width: 0.5,
          bend: 0.15 + t * 0.55,
          curl: 0.3 + t * 1.5,
          cup: 0.75 - t * 0.5,
          ruffle: 0.012,
          baseW: 0.5,
          mid: 0.45,
          tipStart: 0.78,
          colorBase: base,
          colorTip: tip,
          colorEdge: edge,
          seed: seed * 11 + i,
        }),
      { n: 26, r0: [0.05, 0.3], y0: [0.12, -0.14], tilt: [0.3, 1.4], scale: [0.8, 1.15], seed: seed + 1, jitter: 0.12, ease: 0.85 },
    ),
  )
  geoms.push(core(0.07, 0.42, shade(hex, -0.14, 0.05), 0.1))
  geoms.push(...sepals({ n: 5, seed, y0: -0.16, r0: 0.12, tilt: 1.4, len: 0.34 }))
  geoms.push(calyx(0.13, 0.26, GREEN, -0.24))
  return group([meshOf(geoms)], 0.5)
}

// ---------------------------------------------------------------- Peonía
// Peonía: pétalos guarda grandes y acopados formando un cuenco, y una masa
// de pétalos interiores rizados que llena el centro en forma de cúpula.
export function peony({ hex, seed = 2 }) {
  const base = shade(hex, -0.05, 0.04)
  const tip = shade(hex, 0.1, -0.05)
  const edge = shade(hex, 0.16, -0.1)
  const geoms = []
  // masa interior
  geoms.push(
    ...spiral(
      (i, t) =>
        makePetal({
          length: 0.3 + t * 0.2,
          width: 0.26 + t * 0.14,
          bend: 0.1 + t * 0.3,
          curl: 0.4,
          cup: 0.7,
          ruffle: 0.05,
          ruffleFreq: 8,
          twist: 0.2,
          baseW: 0.4,
          mid: 0.5,
          tipStart: 0.6,
          colorBase: base,
          colorTip: tip,
          colorEdge: edge,
          seed: seed * 5 + i,
        }),
      { n: 48, r0: [0.02, 0.28], y0: [0.32, 0.02], tilt: [0.1, 1.0], scale: [0.7, 1.0], seed, jitter: 0.3, ease: 0.8 },
    ),
  )
  // pétalos guarda
  geoms.push(
    ...whorl(
      (i) =>
        makePetal({
          length: 0.56,
          width: 0.6,
          bend: 0.45,
          curl: 0.5,
          cup: 0.55,
          ruffle: 0.03,
          ruffleFreq: 5,
          baseW: 0.45,
          mid: 0.5,
          tipStart: 0.62,
          colorBase: base,
          colorTip: tip,
          colorEdge: edge,
          seed: seed * 13 + i,
        }),
      { n: 9, r0: 0.2, y0: -0.06, tilt: 1.05, jitter: 0.15, seed: seed + 3 },
    ),
  )
  geoms.push(
    ...whorl(
      (i) => makePetal({ length: 0.52, width: 0.6, bend: 0.4, curl: 0.7, cup: 0.4, ruffle: 0.03, baseW: 0.45, tipStart: 0.62, colorBase: base, colorTip: tip, colorEdge: edge, seed: seed * 17 + i }),
      { n: 10, r0: 0.26, y0: -0.12, tilt: 1.35, phase: 0.3, jitter: 0.15, seed: seed + 4 },
    ),
  )
  geoms.push(core(0.1, 0.5, shade(hex, -0.1, 0.03), 0.12))
  geoms.push(...sepals({ n: 5, seed, y0: -0.16, r0: 0.15, tilt: 1.45, len: 0.3, width: 0.16 }))
  geoms.push(calyx(0.15, 0.28, GREEN, -0.24))
  return group([meshOf(geoms)], 0.64)
}

// ---------------------------------------------------------------- Tulipán
// Tulipán: seis tépalos en dos verticilos (tres externos más anchos y tres
// internos), cada uno es un parche de una superficie ovoide, por eso juntos
// forman la copa lisa característica. Dentro: seis estambres negros y un
// pistilo verde de tres lóbulos. Base con mancha amarilla, hoja glauca.
export function tulip({ hex, seed = 3 }) {
  const rand = rng(seed)
  const base = shade(hex, -0.12, 0.06, 0.005)
  const tip = shade(hex, 0.05, -0.02)
  const edge = shade(hex, 0.12, -0.06)
  const blotch = shade('#e6cf62', -0.02).lerp(new THREE.Color(hex), 0.35)
  const openness = 0.9 + rand() * 0.25 // cuánto se abre la copa (variación por flor)
  const H = 0.74
  const rMax = 0.35 * openness
  // perfil de huevo: base estrecha, vientre a 60 %, punta algo cerrada
  const profile = (t) => {
    const belly = 0.09 + (rMax - 0.09) * (1 - Math.pow(1 - Math.min(1, t / 0.62), 2.2))
    const close = 1 - 0.22 * smoothstep(0.62, 1, t) * (1.4 - openness)
    return belly * close
  }
  // contorno: base estrecha, ancho máximo a la mitad, punta suave y apenas apuntada
  const widthFn = (t) => {
    if (t < 0.5) return 0.42 + 0.58 * smoothstep(0, 0.5, t)
    return 1 - 0.9 * Math.pow((t - 0.5) / 0.5, 1.5)
  }
  const tepal = (outer) => (i) =>
    makeCupPetal({
      height: outer ? H : H * 1.03,
      span: outer ? 2.75 : 2.35,
      profile: (t) => profile(t) * (outer ? 1 : 0.93),
      widthFn,
      flare: 0.02 + (openness - 0.9) * 0.15,
      tipStart: 0.75,
      twist: (rand() - 0.5) * 0.08,
      colorBase: base,
      colorTip: tip,
      colorEdge: edge,
      edgeAmount: 0.35,
      colorBlotch: blotch,
      blotchEnd: 0.22,
      nx: 16,
      ny: 22,
    })
  const geoms = [
    ...whorl(tepal(true), { n: 3, r0: 0, y0: 0.02, tilt: 0, seed, jitter: 0.03, scaleJitter: 0.02 }),
    ...whorl(tepal(false), { n: 3, r0: 0, y0: 0.03, tilt: 0, phase: Math.PI / 3, seed: seed + 1, jitter: 0.03, scaleJitter: 0.02 }),
  ]
  // receptáculo y unión con el tallo
  const recept = new THREE.SphereGeometry(0.11, 16, 12)
  recept.scale(1, 0.75, 1)
  recept.translate(0, 0.0, 0)
  geoms.push(paint(recept, '#8fae74'))
  const neck = new THREE.CylinderGeometry(0.06, 0.05, 0.22, 12, 1)
  neck.translate(0, -0.12, 0)
  geoms.push(paint(neck, '#86a56c'))
  // pistilo verde con estigma de tres lóbulos
  const style = new THREE.CylinderGeometry(0.035, 0.045, 0.26, 10, 1)
  style.translate(0, 0.16, 0)
  geoms.push(paint(style, '#a9c47a'))
  for (let i = 0; i < 3; i++) {
    const th = (i / 3) * Math.PI * 2
    const lobe = new THREE.SphereGeometry(0.035, 8, 6)
    lobe.scale(1, 0.7, 1.5)
    lobe.rotateY(th)
    lobe.translate(Math.sin(th) * 0.035, 0.3, Math.cos(th) * 0.035)
    geoms.push(paint(lobe, '#c9d98a'))
  }
  // seis estambres con anteras negras alargadas
  const anthers = []
  for (let i = 0; i < 6; i++) {
    const th = (i / 6) * Math.PI * 2 + 0.2
    const fil = new THREE.CylinderGeometry(0.008, 0.01, 0.22, 5, 1)
    fil.translate(0, 0.11, 0)
    fil.rotateX(0.12)
    fil.rotateY(th)
    fil.translate(Math.sin(th) * 0.075, 0.04, Math.cos(th) * 0.075)
    geoms.push(paint(fil, '#d8c86a'))
    anthers.push(new THREE.Vector3(Math.sin(th) * 0.095, 0.3, Math.cos(th) * 0.095))
  }
  const anth = dots(anthers, 0.028, '#2a2320', { widthSeg: 6, heightSeg: 5 })
  anth.geometry.scale(0.8, 2.4, 0.8)
  // hoja glauca grande, acanalada, abrazando el tallo
  geoms.push(
    transformed(
      makePetal({ length: 1.05, width: 0.34, bend: 0.4, curl: 0.3, cup: 0.9, pointy: 1.2, tipStart: 0.45, twist: 0.35, baseW: 0.7, mid: 0.3, colorBase: '#6f8f6c', colorTip: '#8fae88', nx: 6, ny: 12, seed }),
      { pos: [0.06, -0.85, 0.06], rot: [0.22, 0.9, 0] },
    ),
  )
  return group([meshOf(geoms, petalMaterial('waxy')), anth], 0.36)
}

// ---------------------------------------------------------------- Girasol
// Girasol: disco grueso de flósculos, dos filas de lígulas lanceoladas que
// caen ligeramente en la punta, y brácteas verdes detrás.
export function sunflower({ hex, seed = 4 }) {
  const base = shade(hex, -0.1, 0.1)
  const tip = shade(hex, 0.04)
  const petal = (droop) => (i) =>
    makePetal({
      length: 0.66,
      width: 0.16,
      bend: 0.35,
      curl: droop,
      cup: 0.35,
      baseW: 0.45,
      mid: 0.35,
      tipStart: 0.62,
      pointy: 1.0,
      twist: 0.12,
      colorBase: base,
      colorTip: tip,
      nx: 5,
      ny: 12,
      seed: seed + i,
    })
  const geoms = [
    ...whorl(petal(0.3), { n: 34, r0: 0.43, y0: 0.06, tilt: 1.15, seed, jitter: 0.08 }),
    ...whorl(petal(0.5), { n: 34, r0: 0.44, y0: 0.01, tilt: 1.35, phase: Math.PI / 34, seed: seed + 1, jitter: 0.08, scale: 0.96 }),
    ...whorl(petal(0.65), { n: 30, r0: 0.44, y0: -0.03, tilt: 1.5, phase: Math.PI / 30 + 0.05, seed: seed + 2, jitter: 0.1, scale: 0.9 }),
  ]
  // disco: cúpula gruesa + reverso cónico
  const disc = new THREE.SphereGeometry(0.46, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2)
  disc.scale(1, 0.34, 1)
  disc.translate(0, 0.02, 0)
  geoms.push(paint(disc, '#3a2415'))
  const back = new THREE.ConeGeometry(0.48, 0.22, 40, 1, false)
  back.rotateX(Math.PI)
  back.translate(0, -0.09, 0)
  geoms.push(paint(back, GREEN))
  // brácteas verdes por debajo de los pétalos
  geoms.push(...sepals({ n: 16, len: 0.34, width: 0.11, tilt: 1.6, y0: -0.08, r0: 0.4, seed }))
  geoms.push(...sepals({ n: 12, len: 0.28, width: 0.1, tilt: 1.7, y0: -0.12, r0: 0.36, seed: seed + 2 }))
  const seeds = fibonacciDisc(300, 0.44, 0.06, 0.12)
  const seedDots = dots(seeds, 0.026, '#5a3a1e', { scaleFn: (i) => 0.6 + 0.4 * ((i * 7919) % 100) / 100 })
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
  center.scale(1, 0.6, 1)
  geoms.push(paint(center, centerColor))
  const back = new THREE.CircleGeometry(centerR * 1.02, 24)
  back.rotateX(Math.PI / 2)
  geoms.push(paint(back, GREEN))
  geoms.push(...sepals({ n: 9, len: 0.22, width: 0.08, tilt: 1.5, y0: -0.03, r0: centerR * 0.9, seed }))
  geoms.push(calyx(centerR * 0.7, 0.14, GREEN, -0.07))
  const pts = fibonacciDisc(centerDots.count, centerR * 0.9, centerR * 0.35, centerR * 0.3)
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
// Lirio oriental: seis tépalos largos que salen de un tubo corto, se abren en
// estrella y se curvan hacia atrás en la punta; estambres largos con anteras grandes.
export function lily({ hex, seed = 7 }) {
  const base = shade(hex, -0.05, 0.1)
  const tip = shade(hex, 0.18, -0.15)
  const edge = shade(hex, 0.24, -0.2)
  const petal = (wide) => (i) =>
    makePetal({
      length: 1.05,
      width: wide ? 0.36 : 0.26,
      bend: 0.9,
      curl: 1.3,
      cup: 0.5,
      baseW: 0.22,
      mid: 0.45,
      tipStart: 0.6,
      pointy: 0.75,
      ruffle: 0.03,
      ruffleFreq: 5,
      colorBase: base,
      colorTip: tip,
      colorEdge: edge,
      nx: 8,
      ny: 18,
      seed: seed + i,
    })
  const geoms = [
    ...whorl(petal(true), { n: 3, r0: 0.06, y0: 0.1, tilt: 0.35, seed, jitter: 0.06 }),
    ...whorl(petal(false), { n: 3, r0: 0.06, y0: 0.08, tilt: 0.45, phase: Math.PI / 3, seed: seed + 1, jitter: 0.06 }),
  ]
  const tube = new THREE.CylinderGeometry(0.1, 0.06, 0.24, 12, 1, true)
  tube.translate(0, 0.0, 0)
  geoms.push(paint(tube, base))
  const rand = rng(seed)
  const anthers = []
  const anthDirs = []
  for (let i = 0; i < 6; i++) {
    const th = (i / 6) * Math.PI * 2 + rand() * 0.3
    const dir = new THREE.Vector3(Math.cos(th) * 0.5, 0.75, Math.sin(th) * 0.5)
    const fil = new THREE.CylinderGeometry(0.009, 0.011, dir.length(), 5, 1)
    fil.translate(0, dir.length() / 2, 0)
    fil.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()))
    fil.translate(0, 0.05, 0)
    geoms.push(paint(fil, '#eadfc6'))
    anthers.push(dir.clone().add(new THREE.Vector3(0, 0.05, 0)))
    anthDirs.push(dir)
  }
  const pistil = new THREE.CylinderGeometry(0.014, 0.016, 0.95, 6, 1)
  pistil.translate(0, 0.5, 0)
  pistil.rotateZ(0.12)
  geoms.push(paint(pistil, '#d8c7a4'))
  const stigma = new THREE.SphereGeometry(0.04, 8, 6)
  stigma.scale(1.4, 0.8, 1.4)
  stigma.translate(-0.11, 0.98, 0)
  geoms.push(paint(stigma, '#8d4b2b'))
  geoms.push(calyx(0.09, 0.2, GREEN_LIGHT, -0.12))
  // anteras: elipsoides tumbados perpendiculares al filamento
  const antherGeom = new THREE.SphereGeometry(0.06, 8, 6)
  antherGeom.scale(0.45, 1, 0.45)
  paint(antherGeom, '#a2521f')
  const anth = new THREE.InstancedMesh(antherGeom, floretsMaterial(), 6)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  anthers.forEach((p, i) => {
    const tangent = new THREE.Vector3(-anthDirs[i].z, 0, anthDirs[i].x).normalize()
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent)
    m.compose(p, q, new THREE.Vector3(1, 1, 1))
    anth.setMatrixAt(i, m)
  })
  anth.instanceMatrix.needsUpdate = true
  anth.castShadow = true
  return group([meshOf(geoms, petalMaterial('waxy')), anth], 0.78)
}

// ---------------------------------------------------------------- Orquídea
// Orquídea Phalaenopsis: dos pétalos laterales grandes y redondeados (alas),
// tres sépalos más estrechos detrás y un labelo pequeño con lóbulos.
export function orchid({ hex, seed = 8 }) {
  const base = shade(hex, 0.02)
  const tip = shade(hex, 0.07, -0.05)
  const throat = shade(hex, -0.25, 0.2)
  const sepal = (i) =>
    makePetal({ length: 0.52, width: 0.3, bend: 0.15, cup: 0.12, baseW: 0.3, mid: 0.55, tipStart: 0.62, pointy: 0.5, colorBase: base, colorTip: tip, nx: 8, ny: 12, seed: seed + i })
  const petal = (i) =>
    makePetal({ length: 0.5, width: 0.62, bend: 0.2, cup: 0.08, ruffle: 0.01, baseW: 0.22, mid: 0.6, tipStart: 0.5, colorBase: base, colorTip: tip, nx: 12, ny: 12, seed: seed + 10 + i })
  const geoms = [
    ...whorl(sepal, { n: 3, r0: 0.03, y0: -0.01, tilt: 1.4, phase: Math.PI / 2, seed, jitter: 0.04 }),
    ...whorl(petal, { n: 2, r0: 0.04, y0: 0.02, tilt: 1.35, phase: Math.PI / 2 + Math.PI / 3 + 0.25, seed: seed + 1, jitter: 0.04 }),
  ]
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
  return group([meshOf(geoms, petalMaterial('waxy'))], 0.52)
}

// ---------------------------------------------------------------- Clavel
// Clavel: pompón alto de pétalos con el borde en flecos, sobre un cáliz tubular.
export function carnation({ hex, seed = 9 }) {
  const base = shade(hex, -0.1, 0.05)
  const tip = shade(hex, 0.06)
  const edge = shade(hex, 0.15, -0.1)
  const geoms = spiral(
    (i, t) =>
      makePetal({
        length: 0.27 + t * 0.1,
        width: 0.3,
        bend: 0.3 + t * 0.35,
        curl: 0.4,
        cup: 0.5,
        ruffle: 0.06,
        ruffleFreq: 10,
        fringe: 0.4,
        fringeFreq: 14,
        twist: 0.1,
        baseW: 0.15,
        mid: 0.7,
        tipStart: 0.84,
        colorBase: base,
        colorTip: tip,
        colorEdge: edge,
        nx: 12,
        ny: 10,
        seed: seed * 3 + i,
      }),
    { n: 64, r0: [0.01, 0.16], y0: [0.18, -0.06], tilt: [0.05, 1.2], scale: [0.85, 1.05], seed, jitter: 0.3, ease: 0.9 },
  )
  const cal = new THREE.CylinderGeometry(0.1, 0.075, 0.34, 12, 1)
  cal.translate(0, -0.24, 0)
  geoms.push(paint(cal, GREEN_LIGHT))
  geoms.push(...sepals({ n: 5, len: 0.12, width: 0.08, tilt: 0.5, y0: -0.08, r0: 0.09, seed }))
  return group([meshOf(geoms)], 0.44)
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
// Lavanda: espiga fina con verticilos de florecillas pequeñas separados por
// pequeños huecos, y capullos cerrados hacia la punta.
export function lavender({ hex, seed = 11 }) {
  const rand = rng(seed)
  const pts = []
  const buds = []
  const tall = 0.8
  const whorls = 11
  for (let k = 0; k < whorls; k++) {
    const y = 0.02 + (k / (whorls - 1)) * tall
    const n = 5
    const isBud = k >= whorls - 3
    for (let i = 0; i < n; i++) {
      const th = (i / n) * Math.PI * 2 + k * 0.7 + rand() * 0.4
      const r = isBud ? 0.028 : 0.038 + rand() * 0.012
      const p = new THREE.Vector3(Math.cos(th) * r, y + (rand() - 0.5) * 0.02, Math.sin(th) * r)
      ;(isBud ? buds : pts).push(p)
    }
  }
  const florets = dots(pts, 0.024, hex, { widthSeg: 6, heightSeg: 5, scaleFn: (i) => 0.85 + ((i * 31) % 10) / 33 })
  florets.geometry.scale(1, 1.9, 0.9)
  const budDots = dots(buds, 0.018, shade(hex, -0.08, 0.05), { widthSeg: 5, heightSeg: 4 })
  budDots.geometry.scale(1, 1.8, 1)
  const stem = new THREE.CylinderGeometry(0.01, 0.014, tall + 0.3, 6, 1)
  stem.translate(0, tall / 2 - 0.1, 0)
  paint(stem, '#7f9a6f')
  const leaves = whorl(
    (i) => makePetal({ length: 0.26, width: 0.035, bend: 0.5, cup: 0.3, pointy: 1, tipStart: 0.5, colorBase: '#8fa88a', colorTip: '#a8bca0', nx: 3, ny: 6, seed: seed + i }),
    { n: 4, r0: 0.02, y0: -0.25, tilt: 0.7, seed },
  )
  return group([meshOf([stem, ...leaves]), florets, budDots], 0.2, { spike: true })
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

function floretsMaterial() {
  return petalMaterial('velvet')
}

// ---------------------------------------------------------------- Paniculata
// Paniculata: nube de florecillas diminutas sobre ramificación muy fina.
export function gypsophila({ hex, seed = 13, spread = 0.5 }) {
  const rand = rng(seed)
  const geoms = []
  const pts = []
  const branches = 11
  // apertura: 0 = ramillete cerrado y compacto, 1 = muy abierto
  const open = 0.45 + spread * 1.1
  for (let b = 0; b < branches; b++) {
    const th = (b / branches) * Math.PI * 2 + rand() * 0.5
    const lean = (0.3 + rand() * 0.5) * open
    const len = (0.5 + rand() * 0.4) * (0.8 + spread * 0.4)
    const end = new THREE.Vector3(Math.cos(th) * lean * len, len * 0.85, Math.sin(th) * lean * len)
    const start = new THREE.Vector3(0, -0.3, 0)
    const dir = end.clone().sub(start)
    const stem = new THREE.CylinderGeometry(0.004, 0.007, dir.length(), 4, 1)
    stem.translate(0, dir.length() / 2, 0)
    stem.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()))
    stem.translate(start.x, start.y, start.z)
    geoms.push(paint(stem, '#8da57c'))
    // ramillete: sub-ramas cortas, cada una con varias florecillas
    const sub = 4 + Math.floor(rand() * 3)
    for (let j = 0; j < sub; j++) {
      const off = new THREE.Vector3(rand() - 0.5, rand() - 0.3, rand() - 0.5).multiplyScalar(0.2 + open * 0.14)
      const mid = end.clone().add(off)
      const twig = new THREE.CylinderGeometry(0.0025, 0.003, off.length(), 3, 1)
      twig.translate(0, off.length() / 2, 0)
      twig.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), off.clone().normalize()))
      twig.translate(end.x, end.y, end.z)
      geoms.push(paint(twig, '#9fb58e'))
      const n = 4 + Math.floor(rand() * 4)
      for (let i = 0; i < n; i++) {
        const o2 = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.12)
        pts.push(mid.clone().add(o2))
      }
    }
  }
  const flowers = dots(pts, 0.02, hex, { widthSeg: 6, heightSeg: 5, scaleFn: (i) => 0.7 + ((i * 37) % 10) / 20 })
  return group([meshOf(geoms), flowers], 0.35 + spread * 0.4, { filler: true })
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
  return group([meshOf(geoms, petalMaterial('leaf'))], 0.5, { filler: true, spike: true })
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
