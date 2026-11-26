import { useState } from 'react'
import { api } from '../../api.js'
import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Estado from '../../components/Estado.jsx'
import { useAvisos } from '../../components/Avisos.jsx'
import { fecha } from '../../formato.js'

export default function PostulacionesEmpresa() {
  const avisar = useAvisos()
  const estado = useDatos('/api/postulaciones/empresa')
  const [soloPendientes, setSoloPendientes] = useState(true)
  const [procesando, setProcesando] = useState(null)

  async function decidir(p, nuevo) {
    setProcesando(p.id)
    try {
      await api(`/api/postulaciones/${p.id}/estado`, { method: 'PATCH', body: { estado: nuevo } })
      avisar(nuevo === 'aceptado' ? `Aceptaste a ${p.alumno}.` : `Rechazaste la postulación de ${p.alumno}.`)
      estado.recargar()
    } catch (err) {
      avisar(err.message, 'mal')
    } finally {
      setProcesando(null)
    }
  }

  return (
    <>
      <Encabezado titulo="Postulaciones recibidas">
        Al aceptar a un alumno, coordinación recibe la solicitud para aprobar su residencia.
      </Encabezado>
      <Bloque estado={estado}>
        {(todas) => {
          const pendientes = todas.filter((p) => p.estado === 'pendiente')
          const lista = soloPendientes ? pendientes : todas
          return (
            <>
              <div className="pestanas" role="group" aria-label="Filtrar postulaciones">
                <button type="button" aria-pressed={soloPendientes} onClick={() => setSoloPendientes(true)}>
                  Por decidir ({pendientes.length})
                </button>
                <button type="button" aria-pressed={!soloPendientes} onClick={() => setSoloPendientes(false)}>
                  Todas ({todas.length})
                </button>
              </div>
              {lista.length === 0 ? (
                <Vacio titulo={soloPendientes ? 'No tienes postulaciones por decidir.' : 'Aún no recibes postulaciones.'}>
                  <p>Las postulaciones nuevas aparecen aquí en cuanto un alumno se postula a una de tus vacantes.</p>
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
                      {p.estado === 'pendiente' ? (
                        <span className="fila-acciones">
                          <button type="button" className="boton boton--primario" disabled={procesando === p.id} onClick={() => decidir(p, 'aceptado')}>
                            Aceptar
                          </button>
                          <button type="button" className="boton boton--secundario" disabled={procesando === p.id} onClick={() => decidir(p, 'rechazado')}>
                            Rechazar
                          </button>
                        </span>
                      ) : (
                        <Estado valor={p.estado} />
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
