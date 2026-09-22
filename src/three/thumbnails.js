// Miniaturas: renderiza cada flor (y cada ramo prearmado) con un renderer
// compartido fuera de pantalla y devuelve un data URL. Se cachea por clave.

import * as THREE from 'three'
import { buildFlower } from './flowers.js'
import { buildBouquet, disposeGroup } from './bouquet.js'
import { addLights, createRenderer, environmentFor, ENV_INTENSITY } from './scene.js'

const cache = new Map()
const pending = new Map()
let renderer = null
let scene = null
let camera = null
let queue = []
let scheduled = false

function ensure() {
  if (renderer) return
  const canvas = document.createElement('canvas')
  renderer = createRenderer(canvas, { alpha: true, shadows: true })
  renderer.setPixelRatio(1)
  scene = new THREE.Scene()
  scene.environment = environmentFor(renderer)
  scene.environmentIntensity = ENV_INTENSITY
  addLights(scene, { shadows: true })
  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
}

function renderObject(obj, size, { distance, target, elevation, azimuth }) {
  ensure()
  renderer.setSize(size, size, false)
  scene.add(obj)
  camera.aspect = 1
  camera.position.set(Math.sin(azimuth) * Math.cos(elevation) * distance, Math.sin(elevation) * distance + target[1], Math.cos(azimuth) * Math.cos(elevation) * distance)
  camera.lookAt(target[0], target[1], target[2])
  camera.updateProjectionMatrix()
  renderer.render(scene, camera)
  const url = renderer.domElement.toDataURL('image/png')
  scene.remove(obj)
  disposeGroup(obj)
  return url
}

function pump() {
  scheduled = false
  const start = performance.now()
  while (queue.length && performance.now() - start < 12) {
    const job = queue.shift()
    try {
      const url = job.run()
      cache.set(job.key, url)
      job.resolve(url)
    } catch (e) {
      job.reject(e)
    }
    pending.delete(job.key)
  }
  if (queue.length && !scheduled) {
    scheduled = true
    requestAnimationFrame(pump)
  }
}

function enqueue(key, run) {
  if (cache.has(key)) return Promise.resolve(cache.get(key))
  if (pending.has(key)) return pending.get(key)
  const p = new Promise((resolve, reject) => {
    queue.push({ key, run, resolve, reject })
  })
  pending.set(key, p)
  if (!scheduled) {
    scheduled = true
    requestAnimationFrame(pump)
  }
  return p
}

export function flowerThumbnail(flower, color, size = 420, view = 'auto') {
  const key = `f:${flower.id}:${color.id}:${size}:${view}`
  return enqueue(key, () => {
    const head = buildFlower(flower.model, { hex: color.hex, seed: 7 })
    const r = head.userData.radius || 0.5
    const spike = head.userData.spike
    if (view === 'side') {
      head.rotation.x = 0
      return renderObject(head, size, { distance: spike ? 3.6 : 2.4 + r * 3.2, target: [0, spike ? 0.3 : 0.05, 0], elevation: 0.12, azimuth: 0.4 })
    }
    head.rotation.x = spike ? 0.15 : 0.35
    const dist = spike ? 3.6 : 2.2 + r * 3.4
    return renderObject(head, size, { distance: dist, target: [0, spike ? 0.3 : 0.02, 0], elevation: spike ? 0.35 : 0.85, azimuth: 0.3 })
  })
}

export function bouquetThumbnail(bouquet, key, size = 560) {
  return enqueue(`b:${key}:${size}`, () => {
    const g = buildBouquet(bouquet)
    const r = g.userData.radius || 1.5
    return renderObject(g, size, { distance: 5.4 + r * 1.8, target: [0, -0.95, 0], elevation: 0.5, azimuth: 0.15 })
  })
}

export function cachedThumbnail(key) {
  return cache.get(key)
}
