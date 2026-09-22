import { useEffect, useState } from 'react'
import { Modal } from './Modal.jsx'
import { giftUrl } from '../lib/share.js'
import { createShortLink } from '../lib/api.js'

/**
 * Paso 1: dedicatoria (nombre de quien recibe, mensaje opcional, remitente).
 * Paso 2: link de regalo listo para copiar o compartir.
 */
export function ShareModal({ bouquet, onChange, preview, onClose }) {
  const [step, setStep] = useState('form')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [url, setUrl] = useState('')
  const [isLong, setIsLong] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2500)
    return () => clearTimeout(t)
  }, [copied])

  const next = async () => {
    if (!bouquet.to.trim()) {
      setError('Escribe el nombre de la persona que recibirá el ramo.')
      return
    }
    setError('')
    setStep('creating')
    try {
      setUrl(await createShortLink(bouquet))
      setIsLong(false)
    } catch {
      // sin API disponible: el ramo viaja completo dentro del link
      setUrl(giftUrl(bouquet))
      setIsLong(true)
    }
    setStep('link')
  }

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
  const text = `${bouquet.to ? `${bouquet.to}, ` : ''}te mandé un ramo en 3D 💐 Ábrelo aquí: ${url}`
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  if (step === 'form') {
    return (
      <Modal onClose={onClose} label="Dedicatoria del regalo">
        <div className="share share--form">
          <div className="share__preview share__preview--sm">{preview ? <img src={preview} alt="Vista previa del ramo" /> : <div className="card__skeleton" />}</div>
          <h3>¿Para quién es este ramo?</h3>
          <p>Estos datos aparecerán junto al ramo cuando la persona abra el link.</p>
          <div className="share__fields">
            <div className="field">
              <label htmlFor="gift-to">Para</label>
              <input
                id="gift-to"
                autoFocus
                value={bouquet.to}
                maxLength={40}
                placeholder="Nombre de quien lo recibe"
                onChange={(e) => onChange({ to: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && next()}
              />
            </div>
            <div className="field">
              <label htmlFor="gift-msg">Mensaje personal (opcional)</label>
              <textarea id="gift-msg" rows={3} value={bouquet.message} maxLength={240} placeholder="Unas palabras que acompañen el ramo…" onChange={(e) => onChange({ message: e.target.value })} />
              <span className="field__count">{bouquet.message.length}/240</span>
            </div>
            <div className="field">
              <label htmlFor="gift-from">De (opcional)</label>
              <input id="gift-from" value={bouquet.from} maxLength={40} placeholder="Tu nombre" onChange={(e) => onChange({ from: e.target.value })} />
            </div>
          </div>
          {error && <div className="share__error">{error}</div>}
          <div className="share__actions">
            <button className="btn btn--primary" onClick={next}>
              Crear link de regalo
            </button>
            <button className="btn btn--ghost" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  if (step === 'creating') {
    return (
      <Modal onClose={onClose} label="Creando link">
        <div className="share">
          <div className="share__preview">{preview ? <img src={preview} alt="Vista previa del ramo" /> : <div className="card__skeleton" />}</div>
          <h3>Preparando el ramo…</h3>
          <p>Un momento, estamos generando el link de regalo.</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose} label="Link de regalo">
      <div className="share">
        <div className="share__preview">{preview ? <img src={preview} alt="Vista previa del ramo" /> : <div className="card__skeleton" />}</div>
        <h3>Tu ramo para {bouquet.to} está listo</h3>
        <p>Comparte este link. Al abrirlo verá el ramo en 3D, podrá girarlo y leerá tu mensaje.</p>
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
            <button className="btn btn--soft btn--sm" onClick={() => navigator.share({ title: `Un ramo para ${bouquet.to} · Flauers`, text, url }).catch(() => {})}>
              Compartir…
            </button>
          )}
          <a className="btn btn--ghost btn--sm" href={url} target="_blank" rel="noreferrer">
            Ver como lo verá {bouquet.to}
          </a>
        </div>
        <div className="share__ok">{copied ? 'Link copiado al portapapeles' : isLong ? 'El servicio de links cortos no está disponible ahora; este link largo funciona igual.' : ''}</div>
        <button className="link-btn" onClick={() => setStep('form')}>
          Editar dedicatoria
        </button>
      </div>
    </Modal>
  )
}
