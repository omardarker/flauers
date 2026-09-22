import { useEffect, useMemo, useState } from 'react'
import { decodeBouquet } from '../lib/share.js'
import { fetchBouquet } from '../lib/api.js'
import { FLOWER_BY_ID } from '../data/flowers.js'
import { BouquetViewer } from '../components/BouquetViewer.jsx'
import { Logo } from '../components/Logo.jsx'

export function Gift({ code, id }) {
  const fromCode = useMemo(() => (code ? decodeBouquet(code) : null), [code])
  const [fetched, setFetched] = useState(null)
  const [status, setStatus] = useState(id ? 'loading' : 'ready')
  const [minimal, setMinimal] = useState(false)

  useEffect(() => {
    if (!id) return
    let alive = true
    setStatus('loading')
    fetchBouquet(id)
      .then((b) => {
        if (!alive) return
        setFetched(b)
        setStatus(b ? 'ready' : 'missing')
      })
      .catch(() => alive && setStatus('error'))
    return () => {
      alive = false
    }
  }, [id])

  const bouquet = id ? fetched : fromCode
  const homeHref = `${window.location.origin}/#/`

  if (status === 'loading') {
    return (
      <div className="gift gift--loading">
        <div className="gift__logo">
          <Logo href={homeHref} />
        </div>
        <div className="gift__loading">
          <div className="card__skeleton" />
          <p>Abriendo tu ramo…</p>
        </div>
      </div>
    )
  }

  if (!bouquet || !bouquet.items.length) {
    return (
      <div className="notfound">
        <h1>Este ramo se marchitó</h1>
        <p>{status === 'error' ? 'No pudimos cargar el ramo. Intenta de nuevo en un momento.' : 'El link no es válido o está incompleto.'}</p>
        <a className="btn btn--primary" href={homeHref}>
          Ir a Flauers
        </a>
      </div>
    )
  }

  const names = [...new Set(bouquet.items.map((i) => FLOWER_BY_ID[i.flower]?.name).filter(Boolean))]

  return (
    <div className={`gift ${minimal ? 'gift--minimal' : ''}`}>
      <BouquetViewer bouquet={bouquet} targetY={-1.5} />
      <div className="gift__logo">
        <Logo href={homeHref} />
      </div>
      <span className="gift__hint">Arrastra para girar · Rueda para acercar</span>
      <div className="gift__card">
        <h1>{bouquet.to ? `Para ${bouquet.to}` : 'Un ramo para ti'}</h1>
        {bouquet.message && <p className="msg">“{bouquet.message}”</p>}
        {bouquet.from && <p className="from">Con cariño, {bouquet.from}</p>}
        <p className="flowers">{names.join(' · ')}</p>
      </div>
      <button className="btn btn--soft btn--sm gift__toggle" onClick={() => setMinimal((m) => !m)}>
        {minimal ? 'Mostrar mensaje' : 'Ocultar mensaje'}
      </button>
    </div>
  )
}
