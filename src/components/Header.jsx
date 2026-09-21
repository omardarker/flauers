import { Logo } from './Logo.jsx'
import { parseHash } from '../lib/router.js'

export function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        <Logo />
        <nav className="nav">
          <a href="#/" onClick={(e) => { e.preventDefault(); goTo('ramos') }}>Ramos</a>
          <a href="#/" onClick={(e) => { e.preventDefault(); goTo('catalogo') }}>Catálogo</a>
          <a href="#/armar">Armar ramo</a>
        </nav>
      </div>
    </header>
  )
}

// Lleva a una sección del inicio; si estamos en otra página, navega primero.
function goTo(id) {
  const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  if (parseHash().page !== 'home') {
    window.location.hash = '#/'
    setTimeout(scroll, 80)
  } else {
    scroll()
  }
}
