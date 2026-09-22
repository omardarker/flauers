import { useFlowerThumbnail } from '../lib/useThumbnail.js'

export function FlowerImage({ flower, color, size = 420, alt, className, view }) {
  const url = useFlowerThumbnail(flower, color, size, view)
  if (!url) return <div className="card__skeleton" aria-hidden="true" />
  return <img src={url} alt={alt || `${flower.name} ${color.name}`} className={className} draggable="false" />
}
