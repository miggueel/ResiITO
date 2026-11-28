import { useState } from 'react'
import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Estado from '../../components/Estado.jsx'
import { fecha } from '../../formato.js'

// Solo consulta: la coordinación acepta o rechaza a los alumnos
export default function PostulacionesEmpresa() {
  const estado = useDatos('/api/postulaciones/empresa')
  const [soloPendientes, setSoloPendientes] = useState(false)

  return (
    <>
      <Encabezado titulo="Postulaciones a mis proyectos">
        La coordinación de residencias decide qué alumnos entran a cada proyecto según su cupo.
      </Encabezado>
      <Bloque estado={estado}>
        {(todas) => {
          const pendientes = todas.filter((p) => p.estado === 'pendiente')
          const lista = soloPendientes ? pendientes : todas
          return (
            <>
              <div className="pestanas" role="group" aria-label="Filtrar postulaciones">
                <button type="button" aria-pressed={!soloPendientes} onClick={() => setSoloPendientes(false)}>
                  Todas ({todas.length})
                </button>
                <button type="button" aria-pressed={soloPendientes} onClick={() => setSoloPendientes(true)}>
                  En revisión ({pendientes.length})
                </button>
              </div>
              {lista.length === 0 ? (
                <Vacio titulo="No hay postulaciones aquí.">
                  <p>Las postulaciones aparecen en cuanto un alumno se postula a uno de tus proyectos aprobados.</p>
                </Vacio>
              ) : (
                <ul className="hoja lista-filas">
                  {lista.map((p) => (
                    <li key={p.id} className="fila fila--alta">
                      <span className="fila-cuerpo">
                        <strong>{p.alumno}</strong>
                        <small>{p.carrera}, número de control {p.matricula}</small>
                        <small><a href={`mailto:${p.correo}`}>{p.correo}</a></small>
                      </span>
                      <span className="fila-cuerpo">
                        <span>{p.vacante}</span>
                        <small>Se postuló el {fecha(p.fecha_postulacion)}</small>
                      </span>
                      <Estado valor={p.estado} etiqueta={p.estado === 'pendiente' ? 'En revisión' : undefined} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )
        }}
      </Bloque>
    </>
  )
}
