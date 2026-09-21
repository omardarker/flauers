import { useMemo, useState } from 'react'
import { decodeBouquet, builderUrl } from '../lib/share.js'
import { FLOWER_BY_ID } from '../data/flowers.js'
import { BouquetViewer } from '../components/BouquetViewer.jsx'
import { Logo } from '../components/Logo.jsx'

export function Gift({ code }) {
  const bouquet = useMemo(() => decodeBouquet(code), [code])
  const [minimal, setMinimal] = useState(false)

  if (!bouquet || !bouquet.items.length) {
    return (
      <div className="notfound">
        <h1>Este ramo se marchitó</h1>
        <p>El link no es válido o está incompleto.</p>
        <a className="btn btn--primary" href="#/">
          Ir a Flauers
        </a>
      </div>
    )
  }

  const names = [...new Set(bouquet.items.map((i) => FLOWER_BY_ID[i.flower]?.name).filter(Boolean))]
  const editUrl = `#${builderUrl(bouquet).split('#')[1]}`

  return (
    <div className={`gift ${minimal ? 'gift--minimal' : ''}`}>
      <BouquetViewer bouquet={bouquet} targetY={-1.5} />
      <div className="gift__logo">
        <Logo />
      </div>
      <span className="gift__hint">Arrastra para girar · Rueda para acercar</span>
      <div className="gift__card">
        <h1>{bouquet.to ? `Para ${bouquet.to}` : 'Un ramo para ti'}</h1>
        {bouquet.message && <p className="msg">“{bouquet.message}”</p>}
        {bouquet.from && <p className="from">Con cariño, {bouquet.from}</p>}
        <p className="flowers">{names.join(' · ')}</p>
        <div className="gift__actions">
          <a className="btn btn--primary btn--sm" href="#/">
            Crea tu propio ramo
          </a>
          <a className="btn btn--ghost btn--sm" href={editUrl}>
            Personalizar este ramo
          </a>
        </div>
      </div>
      <button className="btn btn--soft btn--sm gift__toggle" onClick={() => setMinimal((m) => !m)}>
        {minimal ? 'Mostrar mensaje' : 'Ocultar mensaje'}
      </button>
    </div>
  )
}
