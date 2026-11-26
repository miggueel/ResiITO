const fechaCorta = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

export function fecha(valor) {
  if (!valor) return 'Sin fecha'
  // Las fechas DATE de PostgreSQL llegan como 'YYYY-MM-DD' o ISO a medianoche UTC
  const texto = String(valor)
  const d = /^\d{4}-\d{2}-\d{2}$/.test(texto) ? new Date(`${texto}T12:00:00`) : new Date(texto)
  return Number.isNaN(d.getTime()) ? texto : fechaCorta.format(d)
}

export function periodo(inicio, fin) {
  return `${fecha(inicio)} al ${fecha(fin)}`
}

export const CARRERAS = [
  'Ingeniería en Sistemas Computacionales',
  'Ingeniería Civil',
  'Ingeniería Eléctrica',
  'Ingeniería Electrónica',
  'Ingeniería Industrial',
  'Ingeniería Mecánica',
  'Ingeniería Química',
  'Ingeniería en Gestión Empresarial',
  'Licenciatura en Administración',
  'Licenciatura en Contaduría',
]
