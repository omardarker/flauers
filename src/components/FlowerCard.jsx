import { defaultColor } from '../data/flowers.js'
import { FlowerImage } from './FlowerImage.jsx'

export function FlowerCard({ flower, selected, qty, onToggle, onInfo }) {
  const color = defaultColor(flower)
  return (
    <article
      className={`card card--selectable ${selected ? 'card--selected' : ''}`}
      onClick={() => onToggle(flower)}
      role="button"
      aria-pressed={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle(flower)
        }
      }}
    >
      <div className="card__media">
        <FlowerImage flower={flower} color={color} />
        {selected && <span className="card__check" aria-label="Seleccionada">✓</span>}
        {selected && qty > 1 && <span className="card__qty">×{qty}</span>}
        {flower.filler && <span className="card__tag">Relleno</span>}
      </div>
      <div className="card__body">
        <div className="card__title">{flower.name}</div>
        <div className="card__sub">{flower.tagline}</div>
        <div className="card__actions">
          <button
            className="btn btn--ghost btn--sm"
            onClick={(e) => {
              e.stopPropagation()
              onInfo(flower)
            }}
          >
            Saber más
          </button>
          <button
            className={`btn btn--sm ${selected ? 'btn--soft' : 'btn--primary'}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggle(flower)
            }}
          >
            {selected ? 'Quitar' : 'Seleccionar'}
          </button>
        </div>
      </div>
    </article>
  )
}
