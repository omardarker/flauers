import { useMemo, useState } from 'react'
import { FLOWERS } from '../data/flowers.js'
import { PRESET_BOUQUETS, presetToBouquet } from '../data/bouquets.js'
import { FlowerCard } from '../components/FlowerCard.jsx'
import { FlowerInfoModal } from '../components/FlowerInfoModal.jsx'
import { PresetCard } from '../components/PresetCard.jsx'
import { SelectionBar } from '../components/SelectionBar.jsx'
import { BouquetViewer } from '../components/BouquetViewer.jsx'
import { Header } from '../components/Header.jsx'
import { Footer } from '../components/Footer.jsx'
import { builderUrl } from '../lib/share.js'
import { navigate } from '../lib/router.js'

export function Home({ selection, setSelection, toast }) {
  const [info, setInfo] = useState(null)
  const heroBouquet = useMemo(() => presetToBouquet(PRESET_BOUQUETS[0]), [])

  const isSelected = (f) => selection.some((i) => i.flower === f.id)
  const qtyOf = (f) => selection.find((i) => i.flower === f.id)?.qty || 0

  const toggle = (flower) => {
    setSelection((sel) => {
      if (sel.some((i) => i.flower === flower.id)) return sel.filter((i) => i.flower !== flower.id)
      const qty = flower.filler ? 3 : flower.model === 'sunflower' || flower.model === 'hydrangea' ? 1 : 3
      return [...sel, { flower: flower.id, color: flower.colors[0].id, qty }]
    })
  }

  const generate = () => {
    const bouquet = { items: selection, wrap: 'kraft', ribbon: 'lino', to: '', from: '', message: '' }
    navigate(`#${builderUrl(bouquet).split('#')[1]}`)
  }

  const copy = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      toast('Link de regalo copiado')
    } catch {
      toast('No se pudo copiar. Abre el ramo y copia el link desde ahí.')
    }
  }

  return (
    <>
      <Header />
      <main className="container">
        <section className="hero">
          <div>
            <span className="eyebrow">Ramos en 3D para regalar</span>
            <h1>
              Un ramo que se puede <em>girar</em>, no solo mirar.
            </h1>
            <p>
              Elige tus flores, arma el ramo en 3D y envíalo con un link. Quien lo reciba podrá verlo desde todos los ángulos,
              como si lo tuviera en las manos.
            </p>
            <div className="hero__actions">
              <a className="btn btn--primary" href="#catalogo" onClick={(e) => { e.preventDefault(); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }) }}>
                Armar mi ramo
              </a>
              <a className="btn btn--ghost" href="#ramos" onClick={(e) => { e.preventDefault(); document.getElementById('ramos')?.scrollIntoView({ behavior: 'smooth' }) }}>
                Ver ramos listos
              </a>
            </div>
          </div>
          <div className="hero__visual">
            <BouquetViewer bouquet={heroBouquet} />
            <span className="hero__hint">Arrastra para girar</span>
          </div>
        </section>

        <section className="section" id="ramos">
          <div className="section__head">
            <div>
              <span className="eyebrow">Listos para regalar</span>
              <h2>Ramos prearmados</h2>
            </div>
            <p>Combinaciones pensadas por nosotros. Copia el link y listo, o ábrelo en 3D y cámbialo a tu gusto.</p>
          </div>
          <div className="grid grid--wide">
            {PRESET_BOUQUETS.map((p) => (
              <PresetCard key={p.id} preset={p} onCopy={copy} />
            ))}
          </div>
        </section>

        <section className="section" id="catalogo">
          <div className="section__head">
            <div>
              <span className="eyebrow">El diferencial</span>
              <h2>Arma tu propio ramo</h2>
            </div>
            <p>Toca las flores que quieras incluir. Puedes elegir varias; luego ajustas colores y cantidades en el taller 3D.</p>
          </div>
          <div className="grid">
            {FLOWERS.map((f) => (
              <FlowerCard key={f.id} flower={f} selected={isSelected(f)} qty={qtyOf(f)} onToggle={toggle} onInfo={setInfo} />
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section__head">
            <div>
              <span className="eyebrow">Cómo funciona</span>
              <h2>Tres pasos</h2>
            </div>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step__n">01</div>
              <h3>Elige</h3>
              <p>Selecciona las flores del catálogo o parte de un ramo prearmado.</p>
            </div>
            <div className="step">
              <div className="step__n">02</div>
              <h3>Arma</h3>
              <p>Ajusta cantidades, colores, papel y lazo mientras ves el ramo en 3D.</p>
            </div>
            <div className="step">
              <div className="step__n">03</div>
              <h3>Regala</h3>
              <p>Genera el link con tu mensaje. No hace falta registro: el ramo viaja dentro del link.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <SelectionBar items={selection} onGenerate={generate} onClear={() => setSelection([])} />
      {info && <FlowerInfoModal flower={info} selected={isSelected(info)} onToggle={toggle} onClose={() => setInfo(null)} />}
    </>
  )
}
