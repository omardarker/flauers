// Escena interactiva reutilizable: renderer, luces, controles de órbita y
// sombra de contacto. Se monta sobre un <canvas> y se destruye limpiamente.

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { disposeGroup } from './bouquet.js'

let _envCache = null
export function environmentFor(renderer) {
  if (!_envCache) {
    const pmrem = new THREE.PMREMGenerator(renderer)
    _envCache = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
  }
  return _envCache
}

export function createRenderer(canvas, { alpha = true, shadows = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = shadows
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  return renderer
}

export function addLights(scene, { shadows = true } = {}) {
  const hemi = new THREE.HemisphereLight(0xfff7ea, 0xb8c3a4, 1.0)
  scene.add(hemi)
  const key = new THREE.DirectionalLight(0xfff1dc, 1.9)
  key.position.set(3.5, 6, 4)
  key.castShadow = shadows
  if (shadows) {
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.near = 1
    key.shadow.camera.far = 20
    key.shadow.camera.left = -4
    key.shadow.camera.right = 4
    key.shadow.camera.top = 4
    key.shadow.camera.bottom = -4
    key.shadow.bias = -0.0002
    key.shadow.normalBias = 0.03
    key.shadow.radius = 5
    key.shadow.intensity = 0.55
  }
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xdfe9ff, 0.5)
  fill.position.set(-4, 2, -3)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffe3c4, 0.6)
  rim.position.set(0, 3, -6)
  scene.add(rim)
  return { hemi, key, fill, rim }
}

export class BouquetStage {
  constructor(canvas, { targetY = -0.9 } = {}) {
    this.canvas = canvas
    this.targetY = targetY
    this.renderer = createRenderer(canvas)
    this.scene = new THREE.Scene()
    this.scene.environment = environmentFor(this.renderer)
    this.scene.environmentIntensity = 0.55
    addLights(this.scene)

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    this.camera.position.set(0.6, 2.4, 8.0)

    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.target.set(0, targetY, 0)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.06
    this.controls.minDistance = 3.5
    this.controls.maxDistance = 14
    this.controls.maxPolarAngle = Math.PI * 0.92
    this.controls.enablePan = false
    this.controls.autoRotate = true
    this.controls.autoRotateSpeed = 0.9
    this._idleTimer = null
    this.controls.addEventListener('start', () => {
      this.controls.autoRotate = false
      clearTimeout(this._idleTimer)
    })
    this.controls.addEventListener('end', () => {
      clearTimeout(this._idleTimer)
      this._idleTimer = setTimeout(() => (this.controls.autoRotate = true), 5000)
    })

    // sombra de contacto
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.16, color: 0x3d3a2a }))
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -3.05
    ground.receiveShadow = true
    this.scene.add(ground)

    this.group = null
    this._raf = 0
    this._running = false
    this._resizeObs = new ResizeObserver(() => this.resize())
    this._resizeObs.observe(canvas.parentElement || canvas)
    this.resize()
  }

  setBouquet(group) {
    if (this.group) {
      this.scene.remove(this.group)
      disposeGroup(this.group)
    }
    this.group = group
    if (group) {
      this.scene.add(group)
      // encuadre según el tamaño del ramo
      const r = group.userData.radius || 1.5
      const dist = THREE.MathUtils.clamp(5.2 + r * 1.9, 6.5, 12)
      const dir = this.camera.position.clone().sub(this.controls.target).normalize()
      this.camera.position.copy(this.controls.target).add(dir.multiplyScalar(dist))
      this.controls.target.set(0, this.targetY + Math.min(r, 2) * 0.1, 0)
    }
  }

  resize() {
    const el = this.canvas.parentElement || this.canvas
    const w = el.clientWidth || 1
    const h = el.clientHeight || 1
    this.camera.aspect = w / h
    // en pantallas verticales mantenemos el campo de visión horizontal
    const baseFov = 32
    if (this.camera.aspect < 1) {
      const half = Math.tan(THREE.MathUtils.degToRad(baseFov / 2)) / Math.max(this.camera.aspect, 0.62)
      this.camera.fov = Math.min(70, THREE.MathUtils.radToDeg(Math.atan(half)) * 2)
    } else {
      this.camera.fov = baseFov
    }
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
    this.render()
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  start() {
    if (this._running) return
    this._running = true
    const loop = () => {
      if (!this._running) return
      this.controls.update()
      this.render()
      this._raf = requestAnimationFrame(loop)
    }
    loop()
  }

  stop() {
    this._running = false
    cancelAnimationFrame(this._raf)
  }

  snapshot(type = 'image/png') {
    this.render()
    return this.renderer.domElement.toDataURL(type)
  }

  dispose() {
    this.stop()
    this._resizeObs.disconnect()
    clearTimeout(this._idleTimer)
    this.controls.dispose()
    if (this.group) disposeGroup(this.group)
    this.renderer.dispose()
  }
}
