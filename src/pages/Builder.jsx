import { useEffect, useMemo, useRef, useState } from 'react'
import { FLOWERS, FLOWER_BY_ID, findColor } from '../data/flowers.js'
import { WRAPS, RIBBONS } from '../data/bouquets.js'
import { decodeBouquet, builderUrl } from '../lib/share.js'
import { BouquetViewer } from '../components/BouquetViewer.jsx'
import { autoWrapOpenFor } from '../three/bouquet.js'
import { FlowerImage } from '../components/FlowerImage.jsx'
import { ShareModal } from '../components/ShareModal.jsx'
import { Header } from '../components/Header.jsx'

const EMPTY = { items: [], wrap: 'kraft', ribbon: 'lino', to: '', from: '', message: '', layout: {} }
const MAX_STEMS = 40

export function Builder({ code, gift = false, selection, setSelection }) {
  const initial = useMemo(() => {
    if (code) {
      const b = decodeBouquet(code)
      if (b) return b
    }
    if (selection.length) return { ...EMPTY, items: selection }
    return EMPTY
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const [bouquet, setBouquet] = useState(initial)
  const [share, setShare] = useState(null)
  const stageRef = useRef(null)

  useEffect(() => setBouquet(initial), [initial])
  // desde "Regalar este ramo": abre la dedicatoria en cuanto el ramo esté en pantalla
  useEffect(() => {
    if (!gift || !initial.items.length) return
    const t = setTimeout(() => setShare({ preview: stageRef.current?.snapshot('image/png') }), 900)
    return () => clearTimeout(t)
  }, [gift, initial])
  // mantiene sincronizada la selección del catálogo
  useEffect(() => setSelection(bouquet.items), [bouquet.items, setSelection])

  const stems = bouquet.items.reduce((s, i) => s + i.qty, 0)
  const autoOpen = useMemo(() => (bouquet.items.length ? autoWrapOpenFor(bouquet) : 50), [bouquet.items, bouquet.layout])
  const wrapOpen = Number.isFinite(bouquet.wrapOpen) ? bouquet.wrapOpen : autoOpen
  const layout = bouquet.layout || {}
  const hasLayout = Object.keys(layout).length > 0
  const update = (patch) => setBouquet((b) => ({ ...b, ...patch }))
  // descarta posiciones fijadas de tallos que ya no existen
  const pruneLayout = (items) => {
    const out = {}
    Object.entries(layout).forEach(([key, pos]) => {
      const [flower, idx] = key.split(':')
      const it = items.find((i) => i.flower === flower)
      if (it && Number(idx) < it.qty) out[key] = pos
    })
    return out
  }
  const updateItem = (flowerId, patch) => {
    const items = bouquet.items.map((it) => (it.flower === flowerId ? { ...it, ...patch } : it))
    update({ items, layout: pruneLayout(items) })
  }
  const removeItem = (flowerId) => {
    const items = bouquet.items.filter((it) => it.flower !== flowerId)
    update({ items, layout: pruneLayout(items) })
  }
  const moveFlower = (key, pos) => setBouquet((b) => ({ ...b, layout: { ...(b.layout || {}), [key]: pos } }))
  const addFlower = (f) => {
    if (bouquet.items.some((it) => it.flower === f.id)) return
    const qty = f.filler ? 3 : f.model === 'sunflower' || f.model === 'hydrangea' ? 1 : 3
    update({ items: [...bouquet.items, { flower: f.id, color: f.colors[0].id, qty: Math.min(qty, Math.max(1, MAX_STEMS - stems)) }] })
  }

  const openShare = () => {
    const preview = stageRef.current?.snapshot('image/png')
    setShare({ preview })
    // el link del taller también refleja el ramo actual
    window.history.replaceState(null, '', builderUrl(bouquet))
  }

  const available = FLOWERS.filter((f) => !bouquet.items.some((it) => it.flower === f.id))

  return (
    <>
      <Header />
      <div className="builder">
        <div className="builder__stage">
          <BouquetViewer bouquet={bouquet} editable onMove={moveFlower} onReady={(s) => (stageRef.current = s)} />
          {bouquet.items.length === 0 && (
            <div className="stage-empty">
              <div>
                <h3>Tu ramo está vacío</h3>
                <p>Añade flores desde el panel para verlas aparecer aquí.</p>
              </div>
            </div>
          )}
          {bouquet.items.length > 0 && (
            <span className="stage-hint">
              Arrastra una flor para moverla · Arrastra el fondo para girar · Shift: subir o bajar
            </span>
          )}
          {hasLayout && (
            <button className="btn btn--soft btn--sm stage-reset" onClick={() => update({ layout: {} })} title="Vuelve a acomodar todas las flores automáticamente">
              Reacomodar automáticamente
            </button>
          )}
        </div>

        <aside className="builder__panel">
          <div className="panel__section">
            <h3 className="panel__title">Tu ramo</h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
              {stems} {stems === 1 ? 'tallo' : 'tallos'} · {bouquet.items.length} {bouquet.items.length === 1 ? 'variedad' : 'variedades'}
            </p>
          </div>

          <div className="panel__section">
            <h3>
              Flores <small>toca un color para cambiarlo</small>
            </h3>
            {bouquet.items.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>Aún no hay flores. Elige abajo.</p>}
            {bouquet.items.map((it) => {
              const f = FLOWER_BY_ID[it.flower]
              if (!f) return null
              const color = findColor(f, it.color)
              return (
                <div className="item" key={it.flower}>
                  <div className="item__thumb">
                    <FlowerImage flower={f} color={color} size={120} />
                  </div>
                  <div>
                    <div className="item__name">{f.name}</div>
                    <div className="item__colors">
                      {f.colors.map((c) => (
                        <button
                          key={c.id}
                          className={`color-dot ${c.id === it.color ? 'color-dot--active' : ''}`}
                          style={{ background: c.hex }}
                          title={c.name}
                          aria-label={`${f.name} ${c.name}`}
                          onClick={() => updateItem(it.flower, { color: c.id })}
                        />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div className="stepper">
                      <button onClick={() => (it.qty <= 1 ? removeItem(it.flower) : updateItem(it.flower, { qty: it.qty - 1 }))} aria-label="Menos">
                        −
                      </button>
                      <span>{it.qty}</span>
                      <button onClick={() => stems < MAX_STEMS && updateItem(it.flower, { qty: it.qty + 1 })} aria-label="Más" disabled={stems >= MAX_STEMS}>
                        +
                      </button>
                    </div>
                    <button className="item__remove" onClick={() => removeItem(it.flower)} aria-label={`Quitar ${f.name}`}>
                      ×
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {available.length > 0 && (
            <div className="panel__section">
              <h3>Añadir flores</h3>
              <div className="chips">
                {available.map((f) => (
                  <button key={f.id} className="chip" onClick={() => addFlower(f)} disabled={stems >= MAX_STEMS}>
                    <span className="chip__plus">+</span>
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="panel__section">
            <h3>Papel</h3>
            <div className="swatch-row">
              {WRAPS.map((w) => (
                <button key={w.id} className="swatch-btn" onClick={() => update({ wrap: w.id })} title={w.name}>
                  <span className={`color-dot color-dot--lg ${bouquet.wrap === w.id ? 'color-dot--active' : ''}`} style={{ background: w.hex }} />
                  {w.name}
                </button>
              ))}
            </div>
          </div>

          <div className="panel__section">
            <h3>
              Apertura del papel
              <small>{Number.isFinite(bouquet.wrapOpen) ? `${wrapOpen}` : `automática · ${autoOpen}`}</small>
            </h3>
            <div className="range">
              <span className="range__end">Cerrado</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={wrapOpen}
                aria-label="Apertura del papel"
                onChange={(e) => update({ wrapOpen: Number(e.target.value) })}
              />
              <span className="range__end">Abierto</span>
            </div>
            {Number.isFinite(bouquet.wrapOpen) && (
              <button className="link-btn" onClick={() => update({ wrapOpen: undefined })}>
                Volver a automático
              </button>
            )}
          </div>

          <div className="panel__section">
            <h3>Lazo</h3>
            <div className="swatch-row">
              {RIBBONS.map((r) => (
                <button key={r.id} className="swatch-btn" onClick={() => update({ ribbon: r.id })} title={r.name}>
                  <span className={`color-dot color-dot--lg ${bouquet.ribbon === r.id ? 'color-dot--active' : ''}`} style={{ background: r.hex }} />
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          <div className="panel__footer">
            <button className="btn btn--primary btn--block" onClick={openShare} disabled={bouquet.items.length === 0}>
              Generar link de regalo
            </button>
          </div>
        </aside>
      </div>
      {share && <ShareModal preview={share.preview} bouquet={bouquet} onChange={update} onClose={() => setShare(null)} />}
    </>
  )
}
