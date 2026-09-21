// Geometría procedural de pétalos y utilidades compartidas por todas las flores.
// Todas las piezas llevan color por vértice, así una sola instancia de material
// sirve para el ramo completo.

import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export { mergeGeometries }

// Generador pseudoaleatorio determinista (mulberry32): el mismo ramo se ve
// igual para quien lo arma y para quien recibe el link.
export function rng(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const _hsl = { h: 0, s: 0, l: 0 }

// Variación de un color en HSL (lightness y saturation en deltas absolutos).
export function shade(hex, dl = 0, ds = 0, dh = 0) {
  const c = new THREE.Color(hex)
  c.getHSL(_hsl)
  c.setHSL(
    (_hsl.h + dh + 1) % 1,
    THREE.MathUtils.clamp(_hsl.s + ds, 0, 1),
    THREE.MathUtils.clamp(_hsl.l + dl, 0, 1),
  )
  return c
}

export function toColor(c) {
  return c instanceof THREE.Color ? c : new THREE.Color(c)
}

// Añade un atributo de color uniforme a cualquier geometría.
export function paint(geom, color) {
  const c = toColor(color)
  const n = geom.attributes.position.count
  const arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r
    arr[i * 3 + 1] = c.g
    arr[i * 3 + 2] = c.b
  }
  geom.setAttribute('color', new THREE.BufferAttribute(arr, 3))
  return geom
}

const smooth = (x) => {
  x = THREE.MathUtils.clamp(x, 0, 1)
  return x * x * (3 - 2 * x)
}

// Perfil de anchura del pétalo a lo largo de su longitud (t ∈ [0,1]).
function widthProfile(t, { baseW, mid, tipStart, pointy }) {
  const body = baseW + (1 - baseW) * smooth(t / mid)
  const s = THREE.MathUtils.clamp((t - tipStart) / (1 - tipStart), 0, 1)
  const tip = pointy ? Math.pow(1 - s, pointy) : Math.sqrt(Math.max(0, 1 - s * s))
  return body * tip
}

/**
 * Crea la geometría de un pétalo con la base en el origen, creciendo hacia +Y
 * y curvándose hacia +Z (hacia fuera de la flor).
 */
export function makePetal(opts = {}) {
  const {
    length = 0.5,
    width = 0.3,
    bend = 0.6, // curvatura acumulada (radianes) a lo largo del pétalo
    curl = 0, // curvatura extra concentrada en la punta
    cup = 0.3, // concavidad transversal
    ruffle = 0, // ondulación del borde
    ruffleFreq = 9,
    twist = 0,
    baseW = 0.25,
    mid = 0.5,
    tipStart = 0.7,
    pointy = 0,
    nx = 8,
    ny = 12,
    colorBase = '#ffffff',
    colorTip = colorBase,
    colorEdge = null,
    edgeAmount = 0.35,
    seed = 0,
  } = opts

  const rand = rng(seed + 11)
  const cb = toColor(colorBase)
  const ct = toColor(colorTip)
  const ce = colorEdge ? toColor(colorEdge) : null

  const verts = (nx + 1) * (ny + 1)
  const positions = new Float32Array(verts * 3)
  const colors = new Float32Array(verts * 3)
  const uvs = new Float32Array(verts * 2)
  const profileOpts = { baseW, mid, tipStart, pointy }

  const rufflePhase = rand() * Math.PI * 2
  let a = 0
  let py = 0
  let pz = 0
  const tmp = new THREE.Color()
  let k = 0
  for (let j = 0; j <= ny; j++) {
    const t = j / ny
    if (j > 0) {
      const dt = 1 / ny
      a = bend * t + curl * t * t * t
      py += Math.cos(a) * length * dt
      pz += Math.sin(a) * length * dt
    }
    const hw = (width / 2) * widthProfile(t, profileOpts)
    const tw = twist * t
    for (let i = 0; i <= nx; i++) {
      const u = (i / nx) * 2 - 1
      let x = u * hw
      const cupZ = -cup * u * u * hw
      const rz =
        ruffle *
        Math.sin(u * ruffleFreq + t * ruffleFreq * 1.7 + rufflePhase) *
        Math.abs(u) *
        Math.abs(u) *
        (0.2 + 0.8 * t)
      let z = cupZ + rz
      if (twist) {
        const cx = x * Math.cos(tw) - z * Math.sin(tw)
        z = x * Math.sin(tw) + z * Math.cos(tw)
        x = cx
      }
      // giramos el offset transversal para que siga la tangente del pétalo
      const yOff = -z * Math.sin(a)
      const zOff = z * Math.cos(a)
      positions[k * 3] = x
      positions[k * 3 + 1] = py + yOff
      positions[k * 3 + 2] = pz + zOff
      uvs[k * 2] = (u + 1) / 2
      uvs[k * 2 + 1] = t

      tmp.copy(cb).lerp(ct, smooth(t))
      if (ce) tmp.lerp(ce, edgeAmount * Math.pow(Math.abs(u), 2.2))
      colors[k * 3] = tmp.r
      colors[k * 3 + 1] = tmp.g
      colors[k * 3 + 2] = tmp.b
      k++
    }
  }

  const indices = []
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a0 = j * (nx + 1) + i
      const b0 = a0 + nx + 1
      indices.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1)
    }
  }

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geom.setIndex(indices)
  geom.computeVertexNormals()
  return geom
}

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _p = new THREE.Vector3()
const _s = new THREE.Vector3(1, 1, 1)

/**
 * Coloca `n` copias de un pétalo (o de un generador de pétalos) en una corona
 * alrededor del eje Y. Devuelve la lista de geometrías transformadas.
 */
export function whorl(makeGeom, opts = {}) {
  const {
    n = 6,
    r0 = 0.05, // radio de inserción
    y0 = 0, // altura de inserción
    tilt = 0.5, // inclinación hacia fuera (rad)
    phase = 0,
    jitter = 0.08,
    scaleJitter = 0.08,
    seed = 1,
    scale = 1,
  } = opts
  const rand = rng(seed)
  const out = []
  for (let i = 0; i < n; i++) {
    const theta = phase + (i / n) * Math.PI * 2 + (rand() - 0.5) * jitter
    const tl = tilt + (rand() - 0.5) * jitter * 2
    const sc = scale * (1 + (rand() - 0.5) * scaleJitter * 2)
    const g = typeof makeGeom === 'function' ? makeGeom(i, rand) : makeGeom.clone()
    // M = RotY(theta) * Translate(0, y0, r0) * RotX(tilt) * Scale
    _e.set(tl, 0, 0)
    _q.setFromEuler(_e)
    _p.set(0, y0, r0)
    _s.set(sc, sc, sc)
    _m.compose(_p, _q, _s)
    const rot = new THREE.Matrix4().makeRotationY(theta)
    rot.multiply(_m)
    g.applyMatrix4(rot)
    out.push(g)
  }
  return out
}

export function transformed(geom, { pos = [0, 0, 0], rot = [0, 0, 0], scale = 1 } = {}) {
  _e.set(rot[0], rot[1], rot[2])
  _q.setFromEuler(_e)
  _p.set(pos[0], pos[1], pos[2])
  const s = Array.isArray(scale) ? scale : [scale, scale, scale]
  _s.set(s[0], s[1], s[2])
  _m.compose(_p, _q, _s)
  geom.applyMatrix4(_m)
  return geom
}

// Material compartido: color blanco multiplicado por el color de vértice.
let _petalMaterial
export function petalMaterial() {
  if (!_petalMaterial) {
    _petalMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.72,
      metalness: 0,
    })
  }
  return _petalMaterial
}

export function meshOf(geoms, material = petalMaterial()) {
  const list = geoms.filter(Boolean)
  const merged = list.length === 1 ? list[0] : mergeGeometries(list, false)
  const mesh = new THREE.Mesh(merged, material)
  mesh.castShadow = true
  mesh.receiveShadow = false
  return mesh
}

/** Pequeñas esferas instanciadas (centros, florecillas, bayas). */
export function dots(points, radius, color, { widthSeg = 6, heightSeg = 5, scaleFn } = {}) {
  const geom = new THREE.SphereGeometry(radius, widthSeg, heightSeg)
  paint(geom, color)
  const mesh = new THREE.InstancedMesh(geom, petalMaterial(), points.length)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const s = new THREE.Vector3()
  points.forEach((p, i) => {
    const sc = scaleFn ? scaleFn(i) : 1
    s.set(sc, sc, sc)
    m.compose(p, q, s)
    mesh.setMatrixAt(i, m)
  })
  mesh.instanceMatrix.needsUpdate = true
  mesh.castShadow = true
  return mesh
}
