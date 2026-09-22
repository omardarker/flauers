// Escena interactiva reutilizable: renderer, luces, controles de órbita y
// sombra de contacto. Se monta sobre un <canvas> y se destruye limpiamente.

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { disposeGroup, placeFlower, domeY } from './bouquet.js'

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
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.shadowMap.enabled = shadows
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  return renderer
}

export function addLights(scene, { shadows = true } = {}) {
  const hemi = new THREE.HemisphereLight(0xfff7ea, 0xc9cfb8, 1.15)
  scene.add(hemi)
  const key = new THREE.DirectionalLight(0xfff3e2, 1.7)
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
    key.shadow.intensity = 0.38
  }
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xe4ecff, 0.65)
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
    this.camera.position.set(0.6, 3.4, 7.4)

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
    this._drag = null
    this._dragEnabled = false
    this._raycaster = new THREE.Raycaster()
    this._ndc = new THREE.Vector2()
    this._onPointerDown = (e) => this._pointerDown(e)
    this._onPointerMove = (e) => this._pointerMove(e)
    this._onPointerUp = (e) => this._pointerUp(e)
    this._resizeObs = new ResizeObserver(() => this.resize())
    this._resizeObs.observe(canvas.parentElement || canvas)
    this.resize()
  }

  setBouquet(group) {
    if (this._drag) this._endDrag(false)
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

  // ----- Arrastre de flores -----------------------------------------------

  /** Permite tomar una flor con el puntero y moverla. onMove(key, [x, y, z]) al soltar. */
  enableDrag({ onMove } = {}) {
    this.onMove = onMove
    if (this._dragEnabled) return
    this._dragEnabled = true
    // capture: se ejecuta antes que OrbitControls, así podemos bloquear la órbita
    this.canvas.addEventListener('pointerdown', this._onPointerDown, { capture: true })
    this.canvas.addEventListener('pointermove', this._onPointerMove)
    this.canvas.addEventListener('pointerup', this._onPointerUp)
    this.canvas.addEventListener('pointercancel', this._onPointerUp)
  }

  _hitboxes() {
    return this.group ? this.group.userData.flowers.map((fg) => fg.userData.hit) : []
  }

  _pick(e) {
    const rect = this.canvas.getBoundingClientRect()
    this._ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    this._raycaster.setFromCamera(this._ndc, this.camera)
    const hits = this._raycaster.intersectObjects(this._hitboxes(), false)
    return hits.length ? hits[0].object.userData.owner : null
  }

  _pointerDown(e) {
    if (!this._dragEnabled || !this.group) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const fg = this._pick(e)
    if (!fg) return
    e.preventDefault()
    e.stopImmediatePropagation()
    this.controls.enabled = false
    this.controls.autoRotate = false
    clearTimeout(this._idleTimer)
    try {
      this.canvas.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    const head = fg.userData.head
    const vertical = e.shiftKey
    const plane = new THREE.Plane()
    if (vertical) {
      const n = new THREE.Vector3()
      this.camera.getWorldDirection(n)
      n.y = 0
      n.normalize().negate()
      plane.setFromNormalAndCoplanarPoint(n, head.position)
    } else {
      plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), head.position)
    }
    const hit = new THREE.Vector3()
    this._raycaster.ray.intersectPlane(plane, hit)
    const offset = hit ? head.position.clone().sub(hit) : new THREE.Vector3()
    this._drag = { fg, plane, offset, vertical, pointerId: e.pointerId, moved: false }
    head.scale.multiplyScalar(1.06)
    this.canvas.style.cursor = 'grabbing'
  }

  _pointerMove(e) {
    if (!this._dragEnabled || !this.group) return
    const d = this._drag
    if (!d) {
      this.canvas.style.cursor = this._pick(e) ? 'grab' : ''
      return
    }
    if (e.pointerId !== d.pointerId) return
    const rect = this.canvas.getBoundingClientRect()
    this._ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    this._raycaster.setFromCamera(this._ndc, this.camera)
    const hit = new THREE.Vector3()
    if (!this._raycaster.ray.intersectPlane(d.plane, hit)) return
    hit.add(d.offset)
    const { fg } = d
    const { head, def } = fg.userData
    const R = this.group.userData.R || 1
    const pos = head.position.clone()
    if (d.vertical) {
      // Shift: sube o baja la flor
      pos.y = THREE.MathUtils.clamp(hit.y, -1.4, 1.8)
      fg.userData.lift = pos.y - domeY(Math.hypot(pos.x, pos.z), R, def)
    } else {
      const maxR = Math.max(R, 1) + 0.9
      let r = Math.hypot(hit.x, hit.z)
      let x = hit.x
      let z = hit.z
      if (r > maxR) {
        x *= maxR / r
        z *= maxR / r
        r = maxR
      }
      pos.set(x, domeY(r, R, def) + fg.userData.lift, z)
    }
    d.moved = true
    placeFlower(fg, pos)
  }

  _pointerUp(e) {
    const d = this._drag
    if (!d || e.pointerId !== d.pointerId) return
    this._endDrag(true)
  }

  _endDrag(commit) {
    const d = this._drag
    this._drag = null
    if (!d) return
    const { fg } = d
    fg.userData.head.scale.multiplyScalar(1 / 1.06)
    this.controls.enabled = true
    this.canvas.style.cursor = ''
    try {
      this.canvas.releasePointerCapture(d.pointerId)
    } catch {
      /* ignore */
    }
    if (commit && d.moved && this.onMove) {
      const p = fg.userData.head.position
      this.onMove(fg.userData.key, [p.x, p.y, p.z])
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
    if (this._dragEnabled) {
      this.canvas.removeEventListener('pointerdown', this._onPointerDown, { capture: true })
      this.canvas.removeEventListener('pointermove', this._onPointerMove)
      this.canvas.removeEventListener('pointerup', this._onPointerUp)
      this.canvas.removeEventListener('pointercancel', this._onPointerUp)
    }
    this._resizeObs.disconnect()
    clearTimeout(this._idleTimer)
    this.controls.dispose()
    if (this.group) disposeGroup(this.group)
    this.renderer.dispose()
  }
}
