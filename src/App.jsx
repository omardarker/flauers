import { useCallback, useEffect, useState } from 'react'
import { useHashRoute } from './lib/router.js'
import { Home } from './pages/Home.jsx'
import { Builder } from './pages/Builder.jsx'
import { Gift } from './pages/Gift.jsx'

const STORAGE_KEY = 'flauers:selection'

function loadSelection() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function App() {
  const route = useHashRoute()
  const [selection, setSelectionState] = useState(loadSelection)
  const [toastMsg, setToastMsg] = useState('')

  const setSelection = useCallback((next) => {
    setSelectionState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      } catch {
        /* ignore */
      }
      return value
    })
  }, [])

  const toast = useCallback((msg) => setToastMsg(msg), [])
  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(''), 2600)
    return () => clearTimeout(t)
  }, [toastMsg])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [route.page])

  let page
  if (route.page === 'gift') page = <Gift code={route.code} id={route.id} />
  else if (route.page === 'builder') page = <Builder code={route.code} gift={route.gift} selection={selection} setSelection={setSelection} />
  else page = <Home selection={selection} setSelection={setSelection} toast={toast} />

  return (
    <>
      {page}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </>
  )
}
