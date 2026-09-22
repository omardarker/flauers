import { useEffect, useRef } from 'react'
import { BouquetStage } from '../three/scene.js'
import { buildBouquet } from '../three/bouquet.js'

/**
 * Lienzo 3D interactivo. Reconstruye el ramo cuando cambian sus items,
 * el papel o el lazo (con un pequeño debounce para los steppers).
 */
export function BouquetViewer({ bouquet, className, onReady, targetY, editable = false, onMove }) {
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove

  useEffect(() => {
    const stage = new BouquetStage(canvasRef.current, { targetY })
    stageRef.current = stage
    if (editable) stage.enableDrag({ onMove: (key, pos) => onMoveRef.current?.(key, pos) })
    stage.start()
    onReady?.(stage)
    return () => {
      stage.dispose()
      stageRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bouquetRef = useRef(bouquet)
  bouquetRef.current = bouquet

  // flores y disposición: reconstrucción completa (con pequeño debounce)
  const key = JSON.stringify([bouquet.items, bouquet.layout || null])
  useEffect(() => {
    const t = setTimeout(() => {
      const stage = stageRef.current
      const b = bouquetRef.current
      if (!stage) return
      stage.setBouquet(b.items.length ? buildBouquet(b) : null)
    }, 120)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // papel, lazo y apertura: solo se redibuja la envoltura
  useEffect(() => {
    stageRef.current?.updateWrap(bouquetRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bouquet.wrap, bouquet.ribbon, bouquet.wrapOpen, bouquet.wrapHeight])

  return <canvas ref={canvasRef} className={className} aria-label={editable ? "Ramo en 3D. Arrastra una flor para moverla o el fondo para girar." : "Ramo en 3D. Arrastra para girar."} />
}
