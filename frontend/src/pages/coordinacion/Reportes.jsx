import { useState } from 'react'
import { abrirReporte, api } from '../../api.js'
import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Estado from '../../components/Estado.jsx'
import { useAvisos } from '../../components/Avisos.jsx'
import { fecha } from '../../formato.js'

export default function Reportes() {
  const avisar = useAvisos()
  const estado = useDatos('/api/reportes')
  const [soloPendientes, setSoloPendientes] = useState(true)
  const [procesando, setProcesando] = useState(null)

  async function revisar(r, nuevo) {
    setProcesando(r.id)
    try {
      await api(`/api/reportes/${r.id}/estado`, { method: 'PATCH', body: { estado: nuevo } })
      avisar(`Reporte ${r.numero_reporte} de ${r.alumno} ${nuevo}.`)
      estado.recargar()
    } catch (err) {
      avisar(err.message, 'mal')
    } finally {
      setProcesando(null)
    }
  }

  async function abrir(id) {
    try {
      await abrirReporte(id)
    } catch (err) {
      avisar(err.message, 'mal')
    }
  }

  return (
    <>
      <Encabezado titulo="Reportes mensuales">Abre el PDF antes de aprobar o rechazar.</Encabezado>
      <Bloque estado={estado}>
        {(todos) => {
          const pendientes = todos.filter((r) => r.estado === 'pendiente')
          const lista = soloPendientes ? pendientes : todos
          return (
            <>
              <div className="pestanas" role="group" aria-label="Filtrar reportes">
                <button type="button" aria-pressed={soloPendientes} onClick={() => setSoloPendientes(true)}>
                  Por revisar ({pendientes.length})
                </button>
                <button type="button" aria-pressed={!soloPendientes} onClick={() => setSoloPendientes(false)}>
                  Todos ({todos.length})
                </button>
              </div>
              {lista.length === 0 ? (
                <Vacio titulo={soloPendientes ? 'No hay reportes por revisar.' : 'Aún no se han entregado reportes.'} />
              ) : (
                <ul className="hoja lista-filas">
                  {lista.map((r) => (
                    <li key={r.id} className="fila">
                      <span className="fila-cuerpo">
                        <strong>{r.alumno}</strong>
                        <small>Reporte {r.numero_reporte}, entregado el {fecha(r.fecha_entrega)}</small>
                      </span>
                      <button type="button" className="boton boton--tenue" onClick={() => abrir(r.id)}>Abrir PDF</button>
                      {r.estado === 'pendiente' ? (
                        <span className="fila-acciones">
                          <button type="button" className="boton boton--primario" disabled={procesando === r.id} onClick={() => revisar(r, 'aprobado')}>
                            Aprobar
                          </button>
                          <button type="button" className="boton boton--secundario" disabled={procesando === r.id} onClick={() => revisar(r, 'rechazado')}>
                            Rechazar
                          </button>
                        </span>
                      ) : (
                        <Estado valor={r.estado} />
                      )}
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
