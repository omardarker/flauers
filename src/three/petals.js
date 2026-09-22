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
    fringe = 0, // flecos en el borde de la punta (clavel)
    fringeFreq = 14,
    nx = 10,
    ny = 14,
    colorBase = '#ffffff',
    colorTip = colorBase,
    colorEdge = null,
    edgeAmount = 0.35,
    occlusion = 0.2, // oscurecimiento suave en la base (zona interior de la flor)
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
    const hw0 = (width / 2) * widthProfile(t, profileOpts)
    const tw = twist * t
    for (let i = 0; i <= nx; i++) {
      const u = (i / nx) * 2 - 1
      let hw = hw0
      if (fringe && t > 0.75) {
        const f = (t - 0.75) / 0.25
        hw *= 1 - fringe * f * (0.5 + 0.5 * Math.sin(u * fringeFreq + rufflePhase))
      }
      let x = u * hw
      const cupZ = -cup * u * u * hw0
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
      if (occlusion) tmp.multiplyScalar(1 - occlusion * (1 - smooth(Math.min(1, t / 0.7))))
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

const lerp = (a, b, t) => a + (b - a) * t

/** Multiplica el color de vértice de una geometría (oclusión horneada). */
export function darken(geom, factor) {
  const c = geom.attributes.color
  if (!c) return geom
  for (let i = 0; i < c.count; i++) c.setXYZ(i, c.getX(i) * factor, c.getY(i) * factor, c.getZ(i) * factor)
  return geom
}

/**
 * Coloca pétalos en espiral (ángulo áureo), como crecen en una rosa o una
 * peonía. Cada parámetro puede ser un número o un par [inicio, fin] que se
 * interpola desde el centro hacia fuera.
 */
export function spiral(makeGeom, opts = {}) {
  const { n = 30, seed = 1, jitter = 0.1, ease = 1, depthShade = 0.14 } = opts
  const rand = rng(seed)
  const val = (v, t) => (Array.isArray(v) ? lerp(v[0], v[1], t) : v)
  const golden = Math.PI * (3 - Math.sqrt(5))
  const out = []
  for (let i = 0; i < n; i++) {
    const t = Math.pow(n > 1 ? i / (n - 1) : 0, ease)
    const theta = i * golden + (rand() - 0.5) * jitter
    const r0 = val(opts.r0 ?? 0.1, t)
    const y0 = val(opts.y0 ?? 0, t)
    const tilt = val(opts.tilt ?? 0.5, t) + (rand() - 0.5) * jitter
    const sc = val(opts.scale ?? 1, t) * (1 + (rand() - 0.5) * jitter)
    const g = makeGeom(i, t, rand)
    if (depthShade) darken(g, 1 - depthShade * (1 - t))
    _e.set(tilt, 0, 0)
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

// Materiales compartidos (color blanco × color de vértice).
const _materials = {}
const MATERIALS = {
  // pétalos aterciopelados (rosa, peonía, clavel...)
  velvet: { roughness: 0.92, sheen: 0.18, sheenRoughness: 0.85, sheenColor: 0xfff4ec, envMapIntensity: 0.35 },
  // pétalos cerosos y lisos (tulipán, lirio, orquídea)
  waxy: { roughness: 0.62, clearcoat: 0.1, clearcoatRoughness: 0.55, sheen: 0.06, sheenRoughness: 0.7, envMapIntensity: 0.4 },
  // hojas y tallos
  leaf: { roughness: 0.78, clearcoat: 0.04, clearcoatRoughness: 0.6, sheen: 0.04, envMapIntensity: 0.4 },
}

export function petalMaterial(kind = 'velvet') {
  if (!_materials[kind]) {
    const m = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      metalness: 0,
      ...MATERIALS[kind],
    })
    m.userData.shared = true
    _materials[kind] = m
  }
  return _materials[kind]
}

/**
 * Pétalo "de copa": un parche de una superficie de revolución (perfil r(t)),
 * como los tépalos de un tulipán, que juntos forman un huevo liso.
 * Se coloca con whorl({ r0: 0, tilt: 0 }) porque el perfil ya incluye el radio.
 */
export function makeCupPetal(opts = {}) {
  const {
    height = 0.7,
    span = 2.6, // ángulo que abarca el pétalo (rad)
    profile = (t) => 0.1 + 0.25 * Math.sin(Math.PI * t * 0.7),
    widthFn = (t) => 1,
    flare = 0, // apertura extra de la punta hacia fuera
    tipStart = 0.7,
    twist = 0,
    nx = 12,
    ny = 18,
    colorBase = '#ffffff',
    colorTip = colorBase,
    colorEdge = null,
    edgeAmount = 0.3,
    colorBlotch = null, // mancha de la base (interior del tulipán)
    blotchEnd = 0.2,
    occlusion = 0.18,
  } = opts
  const cb = toColor(colorBase)
  const ct = toColor(colorTip)
  const ce = colorEdge ? toColor(colorEdge) : null
  const cbl = colorBlotch ? toColor(colorBlotch) : null
  const verts = (nx + 1) * (ny + 1)
  const positions = new Float32Array(verts * 3)
  const colors = new Float32Array(verts * 3)
  const uvs = new Float32Array(verts * 2)
  const tmp = new THREE.Color()
  let k = 0
  for (let j = 0; j <= ny; j++) {
    const t = j / ny
    const w = widthFn(t)
    const fl = t > tipStart ? flare * smooth((t - tipStart) / (1 - tipStart)) : 0
    const r = profile(t) + fl
    for (let i = 0; i <= nx; i++) {
      const u = (i / nx) * 2 - 1
      const a = u * (span / 2) * w + twist * t
      positions[k * 3] = Math.sin(a) * r
      positions[k * 3 + 1] = t * height
      positions[k * 3 + 2] = Math.cos(a) * r
      uvs[k * 2] = (u + 1) / 2
      uvs[k * 2 + 1] = t
      tmp.copy(cb).lerp(ct, smooth(t))
      if (ce) tmp.lerp(ce, edgeAmount * Math.pow(Math.abs(u), 2.5))
      if (cbl && t < blotchEnd) tmp.lerp(cbl, 1 - smooth(t / blotchEnd))
      if (occlusion) tmp.multiplyScalar(1 - occlusion * (1 - smooth(Math.min(1, t / 0.6))))
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
