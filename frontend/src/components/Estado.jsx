const ETIQUETAS = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptada',
  rechazado: 'Rechazada',
  aprobado: 'Visto bueno',
  aprobada: 'Aprobada',
  en_proceso: 'En proceso',
  finalizada: 'Finalizada',
  no_concluida: 'No concluida',
  liberada: 'Liberada',
  activa: 'Abierta',
  cerrada: 'Cerrada',
  rechazada: 'Rechazada',
}

const TONO = {
  pendiente: 'espera',
  aceptado: 'bien',
  aprobado: 'bien',
  aprobada: 'bien',
  en_proceso: 'curso',
  finalizada: 'bien',
  liberada: 'bien',
  activa: 'bien',
  rechazado: 'mal',
  rechazada: 'mal',
  no_concluida: 'mal',
  cerrada: 'neutro',
}

export default function Estado({ valor, etiqueta }) {
  return (
    <span className={`estado estado--${TONO[valor] ?? 'neutro'}`}>
      {etiqueta ?? ETIQUETAS[valor] ?? valor}
    </span>
  )
}
