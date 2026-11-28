import { Link } from 'react-router-dom'
import { codigoEquipo } from '../formato.js'

// Equipo: los alumnos aceptados en el mismo proyecto.
// - `yo`: residencia_id de quien está viendo (se marca con "tú").
// - `enlace(integrante)`: ruta opcional para abrir la residencia de cada integrante.
// - `compacto`: una línea con la etiqueta y los nombres.
export default function Equipo({ vacanteId, integrantes = [], cupo, yo, enlace, compacto = false }) {
  const individual = cupo === 1 && integrantes.length <= 1
  const nombre = (i) => (i.residencia_id === yo ? `${i.nombre} (tú)` : i.nombre)

  if (compacto) {
    return (
      <span className="equipo">
        <span className={`equipo-etiqueta${individual ? ' equipo-etiqueta--individual' : ''}`}>
          {individual ? 'Individual' : `Equipo ${codigoEquipo(vacanteId)}`}
        </span>
        <small>{integrantes.map(nombre).join(', ')}</small>
      </span>
    )
  }

  if (individual) return <span className="equipo-etiqueta equipo-etiqueta--individual">Individual</span>

  return (
    <div className="equipo equipo--bloque">
      <p>
        <span className="equipo-etiqueta">Equipo {codigoEquipo(vacanteId)}</span>{' '}
        <small>{integrantes.length}{cupo ? ` de ${cupo}` : ''} integrantes</small>
      </p>
      <ul className="equipo-lista">
        {integrantes.map((i) => (
          <li key={i.residencia_id}>
            {enlace && i.residencia_id !== yo
              ? <Link to={enlace(i)}>{i.nombre}</Link>
              : <a href={`mailto:${i.correo}`}>{nombre(i)}</a>}
            <small>{i.matricula}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}
