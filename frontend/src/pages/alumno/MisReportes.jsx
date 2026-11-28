import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api.js'
import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Estado from '../../components/Estado.jsx'
import Campo from '../../components/Campo.jsx'
import Observaciones from '../../components/Observaciones.jsx'
import VistaPDF from '../../components/VistaPDF.jsx'
import Equipo from '../../components/Equipo.jsx'
import { useAvisos } from '../../components/Avisos.jsx'
import { faltanDocentes, fecha } from '../../formato.js'

const MAX_BYTES = 10 * 1024 * 1024

function errorArchivo(archivo) {
  if (!archivo?.size) return 'Elige el archivo PDF.'
  if (archivo.type !== 'application/pdf') return 'El reporte debe ser un archivo PDF.'
  if (archivo.size > MAX_BYTES) return 'El PDF pesa más de 10 MB. Reduce su tamaño e inténtalo de nuevo.'
  return null
}

function Correccion({ reporte, onEntregada }) {
  const avisar = useAvisos()
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    const problema = errorArchivo(datos.get('archivo'))
    if (problema) return setError(problema)
    setEnviando(true)
    setError(null)
    try {
      await api(`/api/reportes/${reporte.id}/archivo`, { method: 'PUT', form: datos })
      avisar(`Corrección del reporte ${reporte.numero_reporte} entregada.`)
      onEntregada()
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <form className="correccion" onSubmit={enviar}>
      <Campo etiqueta="PDF corregido" name="archivo" type="file" accept="application/pdf" required />
      <button type="submit" className="boton boton--primario" disabled={enviando}>
        {enviando ? 'Entregando…' : 'Entregar corrección'}
      </button>
      {error && <p className="error-formulario" role="alert">{error}</p>}
    </form>
  )
}

export default function MisReportes() {
  const avisar = useAvisos()
  const estado = useDatos(['/api/residencias/mis-residencias', '/api/reportes/mis-reportes'])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const formRef = useRef(null)
  const [viendo, setViendo] = useState(null)

  async function subir(e, residenciaId) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    const problema = errorArchivo(datos.get('archivo'))
    setError(problema)
    if (problema) return

    datos.set('residencia_id', String(residenciaId))
    setEnviando(true)
    try {
      await api('/api/reportes', { method: 'POST', form: datos })
      avisar(`Reporte ${datos.get('numero_reporte')} entregado. Tu equipo ya puede verlo.`)
      formRef.current?.reset()
      estado.recargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Encabezado titulo="Reportes">
        Los reportes son del equipo: cuando un integrante entrega uno, todos lo ven. Tu asesor y tu revisor los revisan y dejan observaciones.
      </Encabezado>
      <Bloque estado={estado}>
        {([residencias, reportes]) => {
          const activa = residencias.find((r) => r.estado === 'en_proceso')
          const residencia = activa ?? residencias[0]
          const delEquipo = reportes.filter((r) => r.vacante_id === residencia?.vacante_id)
          const siguiente = delEquipo.reduce((max, r) => Math.max(max, r.numero_reporte), 0) + 1
          const ultimo = delEquipo[delEquipo.length - 1]

          return (
            <div className="dos-columnas">
              <section aria-labelledby="entregar-titulo">
                <h2 id="entregar-titulo" className="subtitulo">Entregar reporte</h2>
                {activa && faltanDocentes(activa.docentes).length > 0 ? (
                  <Vacio titulo="Aún no puedes entregar reportes.">
                    <p>
                      A tu proyecto le falta {faltanDocentes(activa.docentes).join(' y ')}. Coordinación los asigna cuando el proyecto tiene a todos sus alumnos;
                      en cuanto tengas asesor y revisor podrás entregar aquí tus reportes.
                    </p>
                    <Link to="/alumno" className="enlace">Ver el estado de mi residencia</Link>
                  </Vacio>
                ) : activa ? (
                  <form ref={formRef} className="hoja formulario" onSubmit={(e) => subir(e, activa.id)} key={siguiente}>
                    <p className="nota">{activa.vacante}, {activa.empresa}</p>
                    <Equipo vacanteId={activa.vacante_id} integrantes={activa.equipo} cupo={activa.cupo_equipo} yo={activa.id} compacto />
                    {ultimo && (
                      <p className="nota">
                        Último entregado: reporte {ultimo.numero_reporte}
                        {ultimo.subido_por_nombre && `, por ${ultimo.subido_por_id === activa.alumno_id ? 'ti' : ultimo.subido_por_nombre}`}.
                      </p>
                    )}
                    <Campo etiqueta="Número de reporte" name="numero_reporte" type="number" min={1} defaultValue={siguiente} required />
                    <Campo etiqueta="Archivo PDF" name="archivo" type="file" accept="application/pdf" required ayuda="Máximo 10 MB." />
                    {error && <p className="error-formulario" role="alert">{error}</p>}
                    <button type="submit" className="boton boton--primario" disabled={enviando}>
                      {enviando ? 'Entregando…' : 'Entregar reporte'}
                    </button>
                  </form>
                ) : (
                  <Vacio titulo="Puedes entregar reportes cuando tu residencia esté en proceso.">
                    <Link to="/alumno" className="enlace">Ver el estado de mi residencia</Link>
                  </Vacio>
                )}
              </section>

              <section aria-labelledby="entregados-titulo">
                <h2 id="entregados-titulo" className="subtitulo">Entregados por el equipo</h2>
                {reportes.length === 0 ? (
                  <Vacio titulo="Tu equipo aún no entrega reportes." />
                ) : (
                  <ol className="lista-reportes">
                    {reportes.map((r) => (
                      <li key={r.id} className="hoja reporte">
                        <header className="reporte-cabeza">
                          <span className="fila-cuerpo">
                            <strong>Reporte {r.numero_reporte}{r.es_ultimo ? ' (último)' : ''}</strong>
                            <small>
                              {r.fecha_actualizacion ? `Corregido el ${fecha(r.fecha_actualizacion)}` : `Entregado el ${fecha(r.fecha_entrega)}`}
                              {r.subido_por_nombre && ` por ${r.subido_por_id === residencia?.alumno_id ? 'ti' : r.subido_por_nombre}`}
                              {r.revisado_por_nombre && `. Revisó: ${r.revisado_por_nombre}`}
                            </small>
                          </span>
                          <Estado
                            valor={r.estado}
                            etiqueta={r.estado === 'rechazado' ? 'Requiere corrección' : r.estado === 'pendiente' ? 'En revisión' : undefined}
                          />
                          <button type="button" className="boton boton--tenue" onClick={() => setViendo(r)}>Ver PDF</button>
                        </header>
                        <Observaciones lista={r.observaciones} />
                        {r.estado === 'rechazado' && activa && r.vacante_id === activa.vacante_id && (
                          <Correccion reporte={r} onEntregada={estado.recargar} />
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
              <VistaPDF reporte={viendo} onCerrar={() => setViendo(null)} />
            </div>
          )
        }}
      </Bloque>
    </>
  )
}
