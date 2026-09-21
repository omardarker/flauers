import { useEffect, useRef } from 'react'
import { BouquetStage } from '../three/scene.js'
import { buildBouquet } from '../three/bouquet.js'

/**
 * Lienzo 3D interactivo. Reconstruye el ramo cuando cambian sus items,
 * el papel o el lazo (con un pequeño debounce para los steppers).
 */
export function BouquetViewer({ bouquet, className, onReady, targetY }) {
  const canvasRef = useRef(null)
  const stageRef = useRef(null)

  useEffect(() => {
    const stage = new BouquetStage(canvasRef.current, { targetY })
    stageRef.current = stage
    stage.start()
    onReady?.(stage)
    return () => {
      stage.dispose()
      stageRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const key = JSON.stringify([bouquet.items, bouquet.wrap, bouquet.ribbon])
  useEffect(() => {
    const t = setTimeout(() => {
      const stage = stageRef.current
      if (!stage) return
      stage.setBouquet(bouquet.items.length ? buildBouquet(bouquet) : null)
    }, 120)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return <canvas ref={canvasRef} className={className} aria-label="Ramo en 3D. Arrastra para girar." />
}
