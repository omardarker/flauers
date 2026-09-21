import { LogoMark } from './Logo.jsx'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoMark size={22} /> Flauers · Ramos en 3D para regalar con un link
        </div>
        <div>Hecho con flores procedurales. Sin fotos: cada pétalo se dibuja en tu navegador.</div>
      </div>
    </footer>
  )
}
