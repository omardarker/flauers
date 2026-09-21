// Ramos preterminados: recetas listas para regalar.
// items: [flowerId, colorId, cantidad]

export const WRAPS = [
  { id: 'kraft', name: 'Kraft', hex: '#c8a77c' },
  { id: 'crema', name: 'Crema', hex: '#efe6d3' },
  { id: 'salvia', name: 'Salvia', hex: '#a9b8a0' },
  { id: 'rosa', name: 'Rosa viejo', hex: '#d9a9a6' },
  { id: 'terracota', name: 'Terracota', hex: '#b9704f' },
  { id: 'marino', name: 'Azul noche', hex: '#5b6b86' },
]

export const RIBBONS = [
  { id: 'lino', name: 'Lino', hex: '#e4d8c2' },
  { id: 'verde', name: 'Verde oliva', hex: '#6f8060' },
  { id: 'burdeos', name: 'Burdeos', hex: '#7a2b3a' },
  { id: 'dorado', name: 'Dorado', hex: '#c9a457' },
  { id: 'rosa', name: 'Rosa', hex: '#d98ea3' },
]

export const PRESET_BOUQUETS = [
  {
    id: 'amanecer',
    name: 'Amanecer',
    description: 'Rosas durazno, peonías coral y eucalipto. Cálido y luminoso, como una mañana de verano.',
    wrap: 'crema',
    ribbon: 'dorado',
    items: [
      ['rosa', 'durazno', 4],
      ['peonia', 'coral', 3],
      ['margarita', 'crema', 2],
      ['eucalipto', 'verde', 3],
    ],
  },
  {
    id: 'clasico',
    name: 'Clásico',
    description: 'Doce rosas rojas con paniculata. El ramo que nunca falla.',
    wrap: 'kraft',
    ribbon: 'burdeos',
    items: [
      ['rosa', 'rojo', 12],
      ['paniculata', 'blanco', 4],
    ],
  },
  {
    id: 'jardin',
    name: 'Jardín silvestre',
    description: 'Margaritas, lavanda, tulipanes y girasol. Fresco, desordenado y lleno de vida.',
    wrap: 'salvia',
    ribbon: 'lino',
    items: [
      ['girasol', 'amarillo', 1],
      ['margarita', 'blanco', 4],
      ['tulipan', 'amarillo', 3],
      ['lavanda', 'lavanda', 4],
      ['eucalipto', 'verde', 2],
    ],
  },
  {
    id: 'nube',
    name: 'Nube',
    description: 'Hortensias, lirios blancos y paniculata en tonos suaves. Sereno y elegante.',
    wrap: 'crema',
    ribbon: 'verde',
    items: [
      ['hortensia', 'azul', 2],
      ['lirio', 'blanco', 3],
      ['paniculata', 'blanco', 4],
      ['rosa', 'blanco', 3],
    ],
  },
  {
    id: 'fiesta',
    name: 'Fiesta',
    description: 'Gerberas, claveles y crisantemos en colores vivos. Para celebrar.',
    wrap: 'terracota',
    ribbon: 'rosa',
    items: [
      ['gerbera', 'naranja', 3],
      ['gerbera', 'fucsia', 2],
      ['clavel', 'coral', 3],
      ['crisantemo', 'amarillo', 2],
      ['eucalipto', 'verde', 2],
    ],
  },
  {
    id: 'orquidea',
    name: 'Orquídea',
    description: 'Orquídeas fucsia con rosas rosa empolvado y un velo de paniculata. Sofisticado.',
    wrap: 'rosa',
    ribbon: 'lino',
    items: [
      ['orquidea', 'fucsia', 3],
      ['rosa', 'rosa', 5],
      ['paniculata', 'rosa', 3],
      ['eucalipto', 'azulado', 2],
    ],
  },
]

export function presetToBouquet(preset) {
  return {
    items: preset.items.map(([flower, color, qty]) => ({ flower, color, qty })),
    wrap: preset.wrap,
    ribbon: preset.ribbon,
    to: '',
    from: '',
    message: '',
  }
}
