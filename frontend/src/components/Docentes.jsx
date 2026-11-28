import { FUNCION_DOCENTE } from '../formato.js'

// Lista breve de asesores y revisores de un proyecto
export default function Docentes({ lista, vacio = 'Sin docentes asignados' }) {
  if (!lista?.length) return <span className="nota">{vacio}</span>
  return (
    <ul className="docentes">
      {lista.map((d) => (
        <li key={d.docente_id}>
          <span className={`funcion funcion--${d.funcion}`}>{FUNCION_DOCENTE[d.funcion]}</span>
          {d.nombre}
        </li>
      ))}
    </ul>
  )
}
