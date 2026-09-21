import { defaultColor } from '../data/flowers.js'
import { FlowerImage } from './FlowerImage.jsx'
import { Modal } from './Modal.jsx'

const LABELS = {
  familia: 'Familia',
  origen: 'Origen e historia',
  significado: 'Significado',
  temporada: 'Temporada',
  duracion: 'Duración en florero',
  cuidados: 'Cuidados',
  curiosidad: 'Curiosidad',
}

export function FlowerInfoModal({ flower, selected, onToggle, onClose }) {
  const color = defaultColor(flower)
  return (
    <Modal onClose={onClose} label={`Información sobre ${flower.name}`}>
      <div className="info">
        <div className="info__media">
          <FlowerImage flower={flower} color={color} size={520} />
        </div>
        <div className="info__body">
          <h3>{flower.name}</h3>
          <div className="info__sci">{flower.sci}</div>
          <div className="info__swatches" title="Colores disponibles">
            {flower.colors.map((c) => (
              <span key={c.id} className="swatch" style={{ background: c.hex }} title={c.name} />
            ))}
          </div>
          <dl>
            {Object.entries(LABELS).map(([k, label]) =>
              flower.info[k] ? (
                <div key={k}>
                  <dt>{label}</dt>
                  <dd>{flower.info[k]}</dd>
                </div>
              ) : null,
            )}
          </dl>
          <div className="info__actions">
            <button
              className={`btn ${selected ? 'btn--soft' : 'btn--primary'}`}
              onClick={() => {
                onToggle(flower)
                onClose()
              }}
            >
              {selected ? 'Quitar del ramo' : 'Añadir al ramo'}
            </button>
            <button className="btn btn--ghost" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
