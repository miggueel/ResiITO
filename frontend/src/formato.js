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

export const ESTADOS_REPUBLICA = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
  'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán',
  'Zacatecas',
]

export const FUNCION_DOCENTE = { asesor: 'Asesor', revisor: 'Revisor' }

export function lugares(v) {
  const libres = Math.max(0, (v.cupo ?? 0) - (v.aceptados ?? 0))
  return libres === 1 ? '1 lugar disponible' : `${libres} lugares disponibles`
}

// Postulaciones en revisión que un alumno puede tener a la vez (igual que en el backend)
export const MAX_POSTULACIONES = 3

// Los alumnos aceptados en un mismo proyecto forman un equipo; se identifica por el proyecto
export function codigoEquipo(vacanteId) {
  return `EQ-${String(vacanteId).padStart(3, '0')}`
}

// Un proyecto recibe reportes solo cuando tiene asesor y revisor
export function faltanDocentes(docentes = []) {
  return ['asesor', 'revisor'].filter((f) => !docentes.some((d) => d.funcion === f))
}
