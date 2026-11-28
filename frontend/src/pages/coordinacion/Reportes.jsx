import { useState } from 'react'
import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Estado from '../../components/Estado.jsx'
import Observaciones from '../../components/Observaciones.jsx'
import VistaPDF from '../../components/VistaPDF.jsx'
import { codigoEquipo, fecha } from '../../formato.js'

// Consulta: la revisión la hacen los docentes asesores y revisores
export default function Reportes() {
  const estado = useDatos('/api/reportes')
  const [filtro, setFiltro] = useState('todos')
  const [abierto, setAbierto] = useState(null)
  const [viendo, setViendo] = useState(null)

  return (
    <>
      <Encabezado titulo="Reportes">Los asesores y revisores revisan los reportes. Aquí puedes consultarlos con sus observaciones.</Encabezado>
      <Bloque estado={estado}>
        {(todos) => {
          const lista = filtro === 'todos' ? todos : todos.filter((r) => r.estado === filtro)
          return (
            <>
              <div className="pestanas" role="group" aria-label="Filtrar reportes">
                {[['todos', 'Todos'], ['pendiente', 'Por revisar'], ['rechazado', 'En corrección'], ['aprobado', 'Con visto bueno']].map(([v, t]) => (
                  <button key={v} type="button" aria-pressed={filtro === v} onClick={() => setFiltro(v)}>
                    {t} ({v === 'todos' ? todos.length : todos.filter((r) => r.estado === v).length})
                  </button>
                ))}
              </div>
              {lista.length === 0 ? (
                <Vacio titulo="No hay reportes en esta categoría." />
              ) : (
                <ul className="hoja lista-filas">
                  {lista.map((r) => (
                    <li key={r.id} className="fila fila--alta fila--envuelve">
                      <span className="fila-cuerpo">
                        <strong>
                          {r.equipo.length > 1 ? `Equipo ${codigoEquipo(r.vacante_id)}` : r.alumno}, reporte {r.numero_reporte}{r.es_ultimo ? ' (último)' : ''}
                        </strong>
                        <small>{r.vacante}. Entregado el {fecha(r.fecha_actualizacion ?? r.fecha_entrega)}{r.alumno && ` por ${r.alumno}`}</small>
                        {r.equipo.length > 1 && <small>Integrantes: {r.equipo.map((i) => i.nombre).join(', ')}</small>}
                        {r.revisado_por_nombre && <small>Revisó: {r.revisado_por_nombre}</small>}
                      </span>
                      <Estado valor={r.estado} etiqueta={r.estado === 'rechazado' ? 'En corrección' : undefined} />
                      <span className="fila-acciones">
                        {r.observaciones.length > 0 && (
                          <button type="button" className="boton boton--tenue" aria-expanded={abierto === r.id} onClick={() => setAbierto(abierto === r.id ? null : r.id)}>
                            {r.observaciones.length} {r.observaciones.length === 1 ? 'observación' : 'observaciones'}
                          </button>
                        )}
                        <button type="button" className="boton boton--tenue" onClick={() => setViendo(r)}>Ver PDF</button>
                      </span>
                      {abierto === r.id && <div className="fila-completa"><Observaciones lista={r.observaciones} /></div>}
                    </li>
                  ))}
                </ul>
              )}
              <VistaPDF reporte={viendo} onCerrar={() => setViendo(null)} />
            </>
          )
        }}
      </Bloque>
    </>
  )
}
