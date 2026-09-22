import { FLOWERS } from '../data/flowers.js'
import { FlowerImage } from '../components/FlowerImage.jsx'

// Página oculta para revisar los modelos: cada flor grande, desde arriba y de lado.
export function Lab() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const only = params.get('f')
  const list = only ? FLOWERS.filter((f) => only.split(',').includes(f.id)) : FLOWERS
  return (
    <div className="lab">
      {list.map((f) => (
        <div className="lab__row" key={f.id} id={`lab-${f.id}`}>
          <div className="lab__name">{f.name}</div>
          {f.colors.slice(0, 2).map((c) => (
            <div className="lab__cell" key={c.id}>
              <FlowerImage flower={f} color={c} size={480} />
            </div>
          ))}
          <div className="lab__cell">
            <FlowerImage flower={f} color={f.colors[0]} size={480} view="side" />
          </div>
        </div>
      ))}
    </div>
  )
}
