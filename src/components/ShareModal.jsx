import { useEffect, useState } from 'react'
import { Modal } from './Modal.jsx'

export function ShareModal({ url, preview, bouquet, onClose }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2500)
    return () => clearTimeout(t)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      const el = document.getElementById('share-url')
      el?.select()
      document.execCommand?.('copy')
      setCopied(true)
    }
  }
  const text = `${bouquet.to ? `Para ${bouquet.to}: ` : ''}te mandé un ramo en 3D 💐 Ábrelo aquí: ${url}`
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <Modal onClose={onClose} label="Link de regalo">
      <div className="share">
        <div className="share__preview">{preview ? <img src={preview} alt="Vista previa del ramo" /> : <div className="card__skeleton" />}</div>
        <h3>Tu ramo está listo</h3>
        <p>Comparte este link. Quien lo abra verá el ramo en 3D y podrá girarlo con el mouse.</p>
        <div className="share__link">
          <input id="share-url" value={url} readOnly onFocus={(e) => e.target.select()} />
          <button className="btn btn--primary btn--sm" onClick={copy}>
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
        <div className="share__actions">
          <a className="btn btn--soft btn--sm" href={wa} target="_blank" rel="noreferrer">
            Enviar por WhatsApp
          </a>
          {canShare && (
            <button className="btn btn--soft btn--sm" onClick={() => navigator.share({ title: 'Un ramo para ti · Flauers', text, url }).catch(() => {})}>
              Compartir…
            </button>
          )}
          <a className="btn btn--ghost btn--sm" href={url} target="_blank" rel="noreferrer">
            Abrir vista de regalo
          </a>
        </div>
        <div className="share__ok">{copied ? 'Link copiado al portapapeles' : ''}</div>
      </div>
    </Modal>
  )
}
