import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../api.js'
import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Estado from '../../components/Estado.jsx'
import Trayecto from '../../components/Trayecto.jsx'
import Docentes from '../../components/Docentes.jsx'
import Observaciones from '../../components/Observaciones.jsx'
import VistaPDF from '../../components/VistaPDF.jsx'
import Equipo from '../../components/Equipo.jsx'
import Campo from '../../components/Campo.jsx'
import Dialogo from '../../components/Dialogo.jsx'
import { useAvisos } from '../../components/Avisos.jsx'
import { fecha, FUNCION_DOCENTE, periodo } from '../../formato.js'

const ESTATUS = { en_proceso: 'En proceso', finalizada: 'Finalizada', no_concluida: 'No concluida' }

function NuevaObservacion({ reporte, onGuardada }) {
  const avisar = useAvisos()
  const [tipo, setTipo] = useState('error')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    const formulario = e.currentTarget
    const f = new FormData(formulario)
    setEnviando(true)
    setError(null)
    try {
      await api(`/api/reportes/${reporte.id}/observaciones`, {
        method: 'POST',
        body: { tipo, pagina: f.get('pagina') || null, contenido: f.get('contenido') },
      })
      avisar('Observación registrada.')
      formulario.reset()
      onGuardada()
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="formulario observacion-form" onSubmit={enviar}>
      <div className="pestanas" role="group" aria-label="Tipo de observación">
        {[['error', 'Marcar error'], ['comentario', 'Comentario'], ['propuesta', 'Proponer idea']].map(([v, t]) => (
          <button key={v} type="button" aria-pressed={tipo === v} onClick={() => setTipo(v)}>{t}</button>
        ))}
      </div>
      <div className="rejilla-observacion">
        <Campo etiqueta="Página (opcional)" name="pagina" type="number" min={1} />
        <Campo
          etiqueta={tipo === 'error' ? 'Qué está mal y cómo corregirlo' : tipo === 'propuesta' ? 'Tu propuesta' : 'Comentario'}
          name="contenido"
          como="textarea"
          rows={2}
          required
        />
      </div>
      {error && <p className="error-formulario" role="alert">{error}</p>}
      <button type="submit" className="boton boton--secundario" disabled={enviando}>
        {enviando ? 'Guardando…' : 'Agregar observación'}
      </button>
    </form>
  )
}

function Revision({ reporte, onRevisado }) {
  const avisar = useAvisos()
  const [esUltimo, setEsUltimo] = useState(false)
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function decidir(decision) {
    if (decision === 'no_concluido' && !window.confirm('¿Cerrar el proyecto como NO concluido? El estatus del alumno cambiará.')) return
    if (decision === 'aprobado' && esUltimo && !window.confirm('¿Dar visto bueno al último reporte? El proyecto quedará finalizado.')) return
    setEnviando(true)
    setError(null)
    try {
      const r = await api(`/api/reportes/${reporte.id}/revision`, {
        method: 'PATCH',
        body: { decision, es_ultimo: esUltimo },
      })
      avisar(r.mensaje)
      onRevisado()
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <div className="revision">
      <label className="casilla">
        <input type="checkbox" checked={esUltimo} onChange={(e) => setEsUltimo(e.target.checked)} />
        <span>
          <strong>Es el último reporte</strong>
          <small>Al revisarlo se cierra el proyecto como finalizado o no concluido.</small>
        </span>
      </label>
      <div className="acciones acciones--juntas">
        <button type="button" className="boton boton--primario" disabled={enviando} onClick={() => decidir('aprobado')}>
          {esUltimo ? 'Dar visto bueno y finalizar' : 'Dar visto bueno'}
        </button>
        {esUltimo ? (
          <button type="button" className="boton boton--secundario boton--peligro-borde" disabled={enviando} onClick={() => decidir('no_concluido')}>
            Marcar como no concluido
          </button>
        ) : (
          <button type="button" className="boton boton--secundario" disabled={enviando} onClick={() => decidir('rechazado')}>
            Regresar para corrección
          </button>
        )}
      </div>
      {error && <p className="error-formulario" role="alert">{error}</p>}
    </div>
  )
}

function SolicitudCambio({ residencia, onEnviada }) {
  const avisar = useAvisos()
  const opciones = Object.keys(ESTATUS).filter((e) => e !== residencia.estado)
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setEnviando(true)
    setError(null)
    try {
      await api('/api/solicitudes', {
        method: 'POST',
        body: { residencia_id: residencia.id, estado_solicitado: f.get('estado_solicitado'), motivo: f.get('motivo') },
      })
      avisar('Solicitud enviada a coordinación.')
      onEnviada()
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <p className="nota">
        Estatus actual: <strong>{ESTATUS[residencia.estado]}</strong>. El cambio no se aplica hasta que la coordinación lo apruebe.
      </p>
      <Campo etiqueta="Estatus correcto">
        {(id) => (
          <select id={id} name="estado_solicitado" required>
            {opciones.map((o) => <option key={o} value={o}>{ESTATUS[o]}</option>)}
          </select>
        )}
      </Campo>
      <Campo etiqueta="Motivo del cambio" name="motivo" como="textarea" rows={4} minLength={10} required ayuda="Explica a la coordinación por qué el estatus actual es un error." />
      {error && <p className="error-formulario" role="alert">{error}</p>}
      <button type="submit" className="boton boton--primario" disabled={enviando}>
        {enviando ? 'Enviando…' : 'Enviar solicitud a coordinación'}
      </button>
    </form>
  )
}

export default function RevisionResidencia() {
  const { id } = useParams()
  const estado = useDatos([`/api/residencias/${id}`, `/api/residencias/${id}/reportes`])
  const [solicitar, setSolicitar] = useState(false)
  const [viendo, setViendo] = useState(null)

  return (
    <Bloque estado={estado}>
      {([residencia, reportes]) => {
        const cerrada = ['finalizada', 'no_concluida'].includes(residencia.estado)
        return (
          <>
            <p className="migas"><Link to="/docente">Mis residentes</Link></p>
            <Encabezado
              titulo={residencia.alumno}
              accion={cerrada && (
                residencia.solicitud_pendiente_id
                  ? <Estado valor="pendiente" etiqueta="Solicitud de cambio en revisión" />
                  : <button type="button" className="boton boton--secundario" onClick={() => setSolicitar(true)}>Solicitar cambio de estatus</button>
              )}
            >
              {residencia.vacante} en {residencia.empresa}. Tu función: {FUNCION_DOCENTE[residencia.mi_funcion]}.
            </Encabezado>

            <section className="hoja expediente" aria-label="Estado de la residencia">
              <Trayecto estado={residencia.estado} />
            </section>

            <dl className="datos">
              <div><dt>Número de control</dt><dd>{residencia.matricula}</dd></div>
              <div><dt>Equipo</dt><dd><Equipo vacanteId={residencia.vacante_id} integrantes={residencia.equipo} cupo={residencia.cupo_equipo} enlace={(i) => `/docente/residencias/${i.residencia_id}`} /></dd></div>
              <div><dt>Periodo</dt><dd>{periodo(residencia.fecha_inicio, residencia.fecha_fin)}</dd></div>
              <div><dt>Reportes del equipo con visto bueno</dt><dd>{residencia.reportes_aprobados} de {residencia.total_reportes}</dd></div>
              <div><dt>Docentes</dt><dd><Docentes lista={residencia.docentes} /></dd></div>
            </dl>

            <h2 className="subtitulo subtitulo--separado">Reportes {residencia.cupo_equipo > 1 ? 'del equipo' : ''}</h2>
            {residencia.cupo_equipo > 1 && (
              <p className="nota">Los reportes son compartidos. Al revisar el último, el proyecto se cierra para todo el equipo.</p>
            )}
            {reportes.length === 0 ? (
              <Vacio titulo="Aún no se entregan reportes." />
            ) : (
              <ol className="lista-reportes">
                {reportes.map((r) => (
                  <li key={r.id} className="hoja reporte">
                    <header className="reporte-cabeza">
                      <div className="fila-cuerpo">
                        <strong>Reporte {r.numero_reporte}{r.es_ultimo ? ' (último)' : ''}</strong>
                        <small>
                          {r.fecha_actualizacion ? `Corregido el ${fecha(r.fecha_actualizacion)}` : `Entregado el ${fecha(r.fecha_entrega)}`}
                          {r.subido_por_nombre && ` por ${r.subido_por_nombre}`}
                          {r.revisado_por_nombre && `. Revisó: ${r.revisado_por_nombre}`}
                        </small>
                      </div>
                      <Estado valor={r.estado} etiqueta={r.estado === 'rechazado' ? 'En corrección' : r.estado === 'pendiente' ? 'Por revisar' : undefined} />
                      <button type="button" className="boton boton--tenue" onClick={() => setViendo(r)}>Ver PDF</button>
                    </header>
                    <Observaciones lista={r.observaciones} />
                    {residencia.estado === 'en_proceso' && (
                      <>
                        <NuevaObservacion reporte={r} onGuardada={estado.recargar} />
                        {r.estado === 'pendiente' && <Revision reporte={r} onRevisado={estado.recargar} />}
                      </>
                    )}
                  </li>
                ))}
              </ol>
            )}

            <VistaPDF reporte={viendo} onCerrar={() => setViendo(null)} />
            <Dialogo abierto={solicitar} onCerrar={() => setSolicitar(false)} titulo="Solicitar cambio de estatus">
              {solicitar && <SolicitudCambio residencia={residencia} onEnviada={() => { setSolicitar(false); estado.recargar() }} />}
            </Dialogo>
          </>
        )
      }}
    </Bloque>
  )
}
