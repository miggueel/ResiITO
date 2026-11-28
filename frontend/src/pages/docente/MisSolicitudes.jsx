import { Link } from 'react-router-dom'
import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Estado from '../../components/Estado.jsx'
import { fecha } from '../../formato.js'

const ESTATUS = { en_proceso: 'En proceso', finalizada: 'Finalizada', no_concluida: 'No concluida' }

export default function MisSolicitudes() {
  const estado = useDatos('/api/solicitudes/mias')
  return (
    <>
      <Encabezado titulo="Mis solicitudes">
        Cambios de estatus que pediste a la coordinación. Para pedir uno nuevo, abre la residencia desde Mis residentes.
      </Encabezado>
      <Bloque estado={estado}>
        {(lista) =>
          lista.length === 0 ? (
            <Vacio titulo="No has enviado solicitudes." />
          ) : (
            <ul className="hoja lista-filas">
              {lista.map((s) => (
                <li key={s.id} className="fila fila--alta">
                  <span className="fila-cuerpo">
                    <strong>
                      <Link to={`/docente/residencias/${s.residencia_id}`}>{s.alumno}</Link>: {ESTATUS[s.estado_actual] ?? s.estado_actual} a {ESTATUS[s.estado_solicitado]}
                    </strong>
                    <small>{s.vacante}. Enviada el {fecha(s.fecha_solicitud)}</small>
                    <small className="texto-cita">{s.motivo}</small>
                    {s.respuesta && <small>Respuesta de coordinación: {s.respuesta}</small>}
                  </span>
                  <Estado valor={s.estado} etiqueta={s.estado === 'pendiente' ? 'En revisión' : undefined} />
                </li>
              ))}
            </ul>
          )
        }
      </Bloque>
    </>
  )
}
