import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { abrirReporte, api } from '../../api.js'
import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Estado from '../../components/Estado.jsx'
import Campo from '../../components/Campo.jsx'
import { useAvisos } from '../../components/Avisos.jsx'
import { fecha } from '../../formato.js'

const MAX_BYTES = 10 * 1024 * 1024

export default function MisReportes() {
  const avisar = useAvisos()
  const estado = useDatos(['/api/residencias/mis-residencias', '/api/reportes/mis-reportes'])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const formRef = useRef(null)

  async function subir(e, residenciaId) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    const archivo = datos.get('archivo')
    setError(null)
    if (!archivo?.size) return setError('Elige el archivo PDF de tu reporte.')
    if (archivo.type !== 'application/pdf') return setError('El reporte debe ser un archivo PDF.')
    if (archivo.size > MAX_BYTES) return setError('El PDF pesa más de 10 MB. Reduce su tamaño e inténtalo de nuevo.')

    datos.set('residencia_id', String(residenciaId))
    setEnviando(true)
    try {
      await api('/api/reportes', { method: 'POST', form: datos })
      avisar(`Reporte ${datos.get('numero_reporte')} entregado.`)
      formRef.current?.reset()
      estado.recargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  async function descargar(id) {
    try {
      await abrirReporte(id)
    } catch (err) {
      avisar(err.message, 'mal')
    }
  }

  return (
    <>
      <Encabezado titulo="Reportes mensuales">Coordinación revisa y aprueba cada reporte que entregas.</Encabezado>
      <Bloque estado={estado}>
        {([residencias, reportes]) => {
          const activa = residencias.find((r) => r.estado === 'en_proceso')
          const siguiente = reportes.filter((r) => r.residencia_id === activa?.id)
            .reduce((max, r) => Math.max(max, r.numero_reporte), 0) + 1

          return (
            <div className="dos-columnas">
              <section aria-labelledby="entregar-titulo">
                <h2 id="entregar-titulo" className="subtitulo">Entregar reporte</h2>
                {activa ? (
                  <form ref={formRef} className="hoja formulario" onSubmit={(e) => subir(e, activa.id)} key={siguiente}>
                    <p className="nota">{activa.vacante}, {activa.empresa}</p>
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
                <h2 id="entregados-titulo" className="subtitulo">Entregados</h2>
                {reportes.length === 0 ? (
                  <Vacio titulo="Aún no has entregado reportes." />
                ) : (
                  <ol className="hoja lista-filas">
                    {reportes.map((r) => (
                      <li key={r.id} className="fila">
                        <span className="fila-cuerpo">
                          <strong>Reporte {r.numero_reporte}</strong>
                          <small>Entregado el {fecha(r.fecha_entrega)}</small>
                        </span>
                        <Estado valor={r.estado} />
                        <button type="button" className="boton boton--tenue" onClick={() => descargar(r.id)}>
                          Abrir PDF
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          )
        }}
      </Bloque>
    </>
  )
}
