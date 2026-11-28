import { useState } from 'react'
import { api } from '../../api.js'
import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Estado from '../../components/Estado.jsx'
import Campo from '../../components/Campo.jsx'
import Dialogo from '../../components/Dialogo.jsx'
import { useAvisos } from '../../components/Avisos.jsx'
import { fecha } from '../../formato.js'

const ESTATUS = { en_proceso: 'En proceso', finalizada: 'Finalizada', no_concluida: 'No concluida' }

function Resolver({ solicitud, onListo }) {
  const avisar = useAvisos()
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(decision, respuesta) {
    setEnviando(true)
    setError(null)
    try {
      const r = await api(`/api/solicitudes/${solicitud.id}`, { method: 'PATCH', body: { decision, respuesta } })
      avisar(r.mensaje)
      onListo()
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <form
      className="formulario"
      onSubmit={(e) => {
        e.preventDefault()
        enviar(e.nativeEvent.submitter?.value, new FormData(e.currentTarget).get('respuesta'))
      }}
    >
      <dl className="datos datos--lista">
        <div><dt>Alumno</dt><dd>{solicitud.alumno} ({solicitud.matricula})</dd></div>
        <div><dt>Proyecto</dt><dd>{solicitud.vacante}, {solicitud.empresa}</dd></div>
        <div><dt>Cambio solicitado</dt><dd>{ESTATUS[solicitud.estado_actual] ?? solicitud.estado_actual} a {ESTATUS[solicitud.estado_solicitado]}</dd></div>
        <div><dt>Solicita</dt><dd>{solicitud.docente}, {fecha(solicitud.fecha_solicitud)}</dd></div>
      </dl>
      <blockquote className="observacion"><p>{solicitud.motivo}</p></blockquote>
      <Campo etiqueta="Respuesta al docente" name="respuesta" como="textarea" rows={3} ayuda="Obligatoria si rechazas la solicitud." />
      {error && <p className="error-formulario" role="alert">{error}</p>}
      <div className="acciones acciones--juntas">
        <button type="submit" value="aprobada" className="boton boton--primario" disabled={enviando}>Aprobar y cambiar estatus</button>
        <button type="submit" value="rechazada" className="boton boton--secundario" disabled={enviando}>Rechazar</button>
      </div>
    </form>
  )
}

export default function Solicitudes() {
  const estado = useDatos('/api/solicitudes')
  const [soloPendientes, setSoloPendientes] = useState(true)
  const [elegida, setElegida] = useState(null)

  return (
    <>
      <Encabezado titulo="Solicitudes de cambio de estatus">
        Los docentes piden aquí corregir el estatus final de un proyecto. El cambio solo se aplica si lo apruebas.
      </Encabezado>
      <Bloque estado={estado}>
        {(todas) => {
          const pendientes = todas.filter((s) => s.estado === 'pendiente')
          const lista = soloPendientes ? pendientes : todas
          return (
            <>
              <div className="pestanas" role="group" aria-label="Filtrar solicitudes">
                <button type="button" aria-pressed={soloPendientes} onClick={() => setSoloPendientes(true)}>Por resolver ({pendientes.length})</button>
                <button type="button" aria-pressed={!soloPendientes} onClick={() => setSoloPendientes(false)}>Todas ({todas.length})</button>
              </div>
              {lista.length === 0 ? (
                <Vacio titulo={soloPendientes ? 'No hay solicitudes por resolver.' : 'Aún no hay solicitudes.'} />
              ) : (
                <ul className="hoja lista-filas">
                  {lista.map((s) => (
                    <li key={s.id} className="fila fila--alta">
                      <span className="fila-cuerpo">
                        <strong>{s.alumno}: {ESTATUS[s.estado_actual] ?? s.estado_actual} a {ESTATUS[s.estado_solicitado]}</strong>
                        <small>{s.vacante}. Solicita {s.docente}, {fecha(s.fecha_solicitud)}</small>
                        <small className="texto-cita">{s.motivo}</small>
                        {s.respuesta && <small>Respuesta: {s.respuesta}</small>}
                      </span>
                      {s.estado === 'pendiente' ? (
                        <button type="button" className="boton boton--primario" onClick={() => setElegida(s)}>Resolver</button>
                      ) : (
                        <Estado valor={s.estado} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )
        }}
      </Bloque>
      <Dialogo abierto={Boolean(elegida)} onCerrar={() => setElegida(null)} titulo="Resolver solicitud" ancho>
        {elegida && <Resolver solicitud={elegida} onListo={() => { setElegida(null); estado.recargar() }} />}
      </Dialogo>
    </>
  )
}
