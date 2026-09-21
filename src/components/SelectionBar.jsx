import { FLOWER_BY_ID, findColor } from '../data/flowers.js'

export function SelectionBar({ items, onGenerate, onClear }) {
  const count = items.reduce((s, i) => s + i.qty, 0)
  const visible = items.length > 0
  return (
    <div className={`selbar ${visible ? 'selbar--visible' : ''}`} aria-hidden={!visible}>
      <div className="selbar__dots" aria-hidden="true">
        {items.slice(0, 8).map((it) => {
          const f = FLOWER_BY_ID[it.flower]
          return <span key={it.flower} className="selbar__dot" style={{ background: findColor(f, it.color).hex }} />
        })}
      </div>
      <div className="selbar__text">
        <strong>{items.length}</strong> {items.length === 1 ? 'tipo de flor' : 'tipos de flor'} · {count} tallos
      </div>
      <button className="link" onClick={onClear}>
        limpiar
      </button>
      <button className="btn btn--primary" onClick={onGenerate}>
        Generar ramo →
      </button>
    </div>
  )
}
