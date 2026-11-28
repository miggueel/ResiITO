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

function FormularioAceptar({ postulacion, onListo }) {
  const avisar = useAvisos()
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget))
    if (f.fecha_inicio > f.fecha_fin) return setError('La fecha de término debe ser posterior a la de inicio.')
    setEnviando(true)
    setError(null)
    try {
      const r = await api(`/api/postulaciones/${postulacion.id}/decision`, {
        method: 'PATCH',
        body: { estado: 'aceptado', fecha_inicio: f.fecha_inicio, fecha_fin: f.fecha_fin },
      })
      avisar(r.mensaje)
      onListo()
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <p className="nota">
        {postulacion.alumno} en {postulacion.vacante} ({postulacion.empresa}).
        Ocupará uno de los {postulacion.cupo} lugares; quedan {postulacion.cupo - postulacion.aceptados}.
      </p>
      <div className="rejilla-campos">
        <Campo etiqueta="Inicio de la residencia" name="fecha_inicio" type="date" required autoFocus />
        <Campo etiqueta="Término" name="fecha_fin" type="date" required />
      </div>
      {error && <p className="error-formulario" role="alert">{error}</p>}
      <button type="submit" className="boton boton--primario" disabled={enviando}>
        {enviando ? 'Aceptando…' : 'Aceptar alumno'}
      </button>
    </form>
  )
}

export default function Postulaciones() {
  const avisar = useAvisos()
  const estado = useDatos('/api/postulaciones')
  const [soloPendientes, setSoloPendientes] = useState(true)
  const [aceptando, setAceptando] = useState(null)
  const [procesando, setProcesando] = useState(null)

  async function rechazar(p) {
    if (!window.confirm(`¿Rechazar la postulación de ${p.alumno} a ${p.vacante}?`)) return
    setProcesando(p.id)
    try {
      await api(`/api/postulaciones/${p.id}/decision`, { method: 'PATCH', body: { estado: 'rechazado' } })
      avisar(`Postulación de ${p.alumno} rechazada.`)
      estado.recargar()
    } catch (err) {
      avisar(err.message, 'mal')
    } finally {
      setProcesando(null)
    }
  }

  return (
    <>
      <Encabezado titulo="Postulaciones">
        Acepta a los alumnos en los proyectos respetando el cupo, o rechaza su postulación.
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
                <Vacio titulo={soloPendientes ? 'No hay postulaciones por decidir.' : 'Aún no hay postulaciones.'} />
              ) : (
                <ul className="hoja lista-filas">
                  {lista.map((p) => {
                    const lleno = p.aceptados >= p.cupo
                    return (
                      <li key={p.id} className="fila fila--alta">
                        <span className="fila-cuerpo">
                          <strong>{p.alumno}</strong>
                          <small>{p.carrera}, número de control {p.matricula}{p.semestre ? `, ${p.semestre}.º semestre` : ''}</small>
                          <small><a href={`mailto:${p.correo}`}>{p.correo}</a></small>
                        </span>
                        <span className="fila-cuerpo">
                          <span>{p.vacante}</span>
                          <small>{p.empresa}. Cupo: {p.aceptados} de {p.cupo}</small>
                          <small>Se postuló el {fecha(p.fecha_postulacion)}</small>
                        </span>
                        {p.estado === 'pendiente' ? (
                          <span className="fila-acciones">
                            <button
                              type="button"
                              className="boton boton--primario"
                              disabled={lleno}
                              title={lleno ? 'El proyecto ya tiene su cupo completo' : undefined}
                              onClick={() => setAceptando(p)}
                            >
                              {lleno ? 'Cupo lleno' : 'Aceptar'}
                            </button>
                            <button type="button" className="boton boton--secundario" disabled={procesando === p.id} onClick={() => rechazar(p)}>
                              Rechazar
                            </button>
                          </span>
                        ) : (
                          <Estado valor={p.estado} />
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          )
        }}
      </Bloque>
      <Dialogo abierto={Boolean(aceptando)} onCerrar={() => setAceptando(null)} titulo="Aceptar alumno">
        {aceptando && <FormularioAceptar postulacion={aceptando} onListo={() => { setAceptando(null); estado.recargar() }} />}
      </Dialogo>
    </>
  )
}
