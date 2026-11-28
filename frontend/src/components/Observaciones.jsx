import { fecha, FUNCION_DOCENTE } from '../formato.js'

const TIPO = {
  error: 'Error',
  comentario: 'Comentario',
  propuesta: 'Propuesta',
}

// Observaciones de asesores y revisores sobre un reporte
export default function Observaciones({ lista }) {
  if (!lista?.length) return null
  return (
    <ul className="observaciones">
      {lista.map((o) => (
        <li key={o.id} className={`observacion-item observacion-item--${o.tipo}`}>
          <p className="observacion-meta">
            <span>
              <strong>{TIPO[o.tipo]}</strong>
              {o.pagina && `, página ${o.pagina}`}
            </span>
            <span className="observacion-autor">
              {o.docente}{o.funcion ? ` (${FUNCION_DOCENTE[o.funcion].toLowerCase()})` : ''}, {fecha(o.fecha_creacion)}
            </span>
          </p>
          <p>{o.contenido}</p>
        </li>
      ))}
    </ul>
  )
}
