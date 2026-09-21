export function LogoMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g fill="#e2a7a9">
        <ellipse cx="32" cy="17" rx="7" ry="11" />
        <ellipse cx="32" cy="47" rx="7" ry="11" />
        <ellipse cx="17" cy="32" rx="11" ry="7" />
        <ellipse cx="47" cy="32" rx="11" ry="7" />
      </g>
      <g fill="#f0c3c2" opacity="0.9">
        <ellipse cx="21.5" cy="21.5" rx="6" ry="9" transform="rotate(-45 21.5 21.5)" />
        <ellipse cx="42.5" cy="21.5" rx="6" ry="9" transform="rotate(45 42.5 21.5)" />
        <ellipse cx="21.5" cy="42.5" rx="6" ry="9" transform="rotate(45 21.5 42.5)" />
        <ellipse cx="42.5" cy="42.5" rx="6" ry="9" transform="rotate(-45 42.5 42.5)" />
      </g>
      <circle cx="32" cy="32" r="6.5" fill="#d9b25c" />
    </svg>
  )
}

export function Logo({ href = '#/' }) {
  return (
    <a className="logo" href={href} aria-label="Flauers, inicio">
      <LogoMark />
      Flauers
    </a>
  )
}
