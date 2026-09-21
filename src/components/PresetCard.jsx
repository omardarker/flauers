import { useMemo } from 'react'
import { presetToBouquet } from '../data/bouquets.js'
import { FLOWER_BY_ID } from '../data/flowers.js'
import { useBouquetThumbnail } from '../lib/useThumbnail.js'
import { builderUrl, giftUrl } from '../lib/share.js'

export function PresetCard({ preset, onCopy }) {
  const bouquet = useMemo(() => presetToBouquet(preset), [preset])
  const url = useBouquetThumbnail(bouquet, preset.id, 560)
  const names = preset.items.map(([id]) => FLOWER_BY_ID[id]?.name).filter(Boolean)
  const summary = [...new Set(names)].join(' · ')
  return (
    <article className="card">
      <div className="card__media card__media--bouquet">
        {url ? <img src={url} alt={`Ramo ${preset.name}`} draggable="false" /> : <div className="card__skeleton" />}
      </div>
      <div className="card__body">
        <div className="card__title">{preset.name}</div>
        <div className="card__sub">{summary}</div>
        <p className="card__desc">{preset.description}</p>
        <div className="card__actions">
          <a className="btn btn--primary btn--sm" href={builderUrl(bouquet).split('#')[1] ? `#${builderUrl(bouquet).split('#')[1]}` : '#/armar'}>
            Ver en 3D y personalizar
          </a>
          <button className="btn btn--ghost btn--sm" onClick={() => onCopy(giftUrl(bouquet))}>
            Copiar link de regalo
          </button>
        </div>
      </div>
    </article>
  )
}
