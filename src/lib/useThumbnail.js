import { useEffect, useState } from 'react'
import { flowerThumbnail, bouquetThumbnail } from '../three/thumbnails.js'

export function useFlowerThumbnail(flower, color, size, view) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let alive = true
    setUrl(null)
    flowerThumbnail(flower, color, size, view).then((u) => alive && setUrl(u)).catch(() => {})
    return () => {
      alive = false
    }
  }, [flower, color, size, view])
  return url
}

export function useBouquetThumbnail(bouquet, key, size) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let alive = true
    setUrl(null)
    if (!bouquet || !bouquet.items.length) return
    bouquetThumbnail(bouquet, key, size).then((u) => alive && setUrl(u)).catch(() => {})
    return () => {
      alive = false
    }
  }, [bouquet, key, size])
  return url
}
