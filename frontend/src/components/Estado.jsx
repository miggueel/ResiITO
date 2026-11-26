const ETIQUETAS = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptada',
  rechazado: 'Rechazada',
  aprobado: 'Aprobado',
  aprobada: 'Aprobada',
  en_proceso: 'En proceso',
  finalizada: 'Finalizada',
  liberada: 'Liberada',
  activa: 'Activa',
  cerrada: 'Cerrada',
}

const TONO = {
  pendiente: 'espera',
  aceptado: 'bien',
  aprobado: 'bien',
  aprobada: 'bien',
  en_proceso: 'curso',
  finalizada: 'curso',
  liberada: 'bien',
  activa: 'bien',
  rechazado: 'mal',
  cerrada: 'neutro',
}

export default function Estado({ valor, etiqueta }) {
  return (
    <span className={`estado estado--${TONO[valor] ?? 'neutro'}`}>
      {etiqueta ?? ETIQUETAS[valor] ?? valor}
    </span>
  )
}
