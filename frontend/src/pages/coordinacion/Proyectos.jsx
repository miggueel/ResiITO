import { useState } from 'react'
import { api } from '../../api.js'
import { useDatos } from '../../useDatos.js'
import { Bloque, Vacio } from '../../components/Estados.jsx'
import Encabezado from '../../components/Encabezado.jsx'
import Estado from '../../components/Estado.jsx'
import Campo from '../../components/Campo.jsx'
import Dialogo from '../../components/Dialogo.jsx'
import Docentes from '../../components/Docentes.jsx'
import Equipo from '../../components/Equipo.jsx'
import { useAvisos } from '../../components/Avisos.jsx'
import { FUNCION_DOCENTE } from '../../formato.js'

// Equipo completo y aún sin asesor o sin revisor: listo para asignar docentes
const faltanDocentes = (p) =>
  ['activa', 'cerrada'].includes(p.estado) && p.aceptados >= p.cupo &&
  !(p.docentes.some((d) => d.funcion === 'asesor') && p.docentes.some((d) => d.funcion === 'revisor'))

const FILTROS = [
  ['pendiente', 'Por revisar'],
  ['docentes', 'Asignar docentes'],
  ['activa', 'Abiertos'],
  ['cerrada', 'Cerrados'],
  ['rechazada', 'Rechazados'],
]

function Revision({ proyecto, onListo }) {
  const avisar = useAvisos()
  const [decision, setDecision] = useState('aprobar')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setEnviando(true)
    setError(null)
    try {
      const r = await api(`/api/vacantes/${proyecto.id}/revision`, {
        method: 'PATCH',
        body: decision === 'aprobar'
          ? { decision, cupo: Number(f.get('cupo')) }
          : { decision, motivo: f.get('motivo') },
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
      <div className="resumen-proyecto">
        <p><strong>{proyecto.titulo}</strong></p>
        <p className="nota">{proyecto.empresa}, {proyecto.estado_republica ?? 'estado sin registrar'}. {proyecto.carrera || 'Cualquier carrera'}</p>
        {proyecto.descripcion && <p>{proyecto.descripcion}</p>}
        {proyecto.requisitos && <p className="nota">Requisitos: {proyecto.requisitos}</p>}
      </div>
      <div className="pestanas" role="group" aria-label="Decisión">
        <button type="button" aria-pressed={decision === 'aprobar'} onClick={() => setDecision('aprobar')}>Aprobar</button>
        <button type="button" aria-pressed={decision === 'rechazar'} onClick={() => setDecision('rechazar')}>Rechazar</button>
      </div>
      {decision === 'aprobar' ? (
        <Campo etiqueta="Cupo de alumnos" name="cupo" type="number" min={1} defaultValue={1} required ayuda="Cuántos alumnos puede aceptar este proyecto." />
      ) : (
        <Campo etiqueta="Motivo del rechazo" name="motivo" como="textarea" rows={3} required ayuda="La empresa lo verá para corregir y reenviar su proyecto." />
      )}
      {error && <p className="error-formulario" role="alert">{error}</p>}
      <button type="submit" className="boton boton--primario" disabled={enviando}>
        {decision === 'aprobar' ? 'Aprobar y publicar' : 'Rechazar proyecto'}
      </button>
    </form>
  )
}

function Gestion({ proyecto, docentes, onCambio }) {
  const avisar = useAvisos()
  const [error, setError] = useState(null)
  const completo = proyecto.aceptados >= proyecto.cupo
  const asignados = new Set(proyecto.docentes.map((d) => d.docente_id))
  // Un docente por proyecto (no puede ser asesor y revisor a la vez) y una persona por función
  const disponibles = docentes.filter((d) => d.docente_id && d.estado_cuenta !== 'inactiva' && !asignados.has(d.docente_id))
  const funcionesLibres = ['asesor', 'revisor'].filter((f) => !proyecto.docentes.some((d) => d.funcion === f))

  async function llamar(promesa, exito) {
    setError(null)
    try {
      await promesa
      avisar(exito)
      onCambio()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="formulario">
      <form
        className="fila-formulario"
        onSubmit={(e) => {
          e.preventDefault()
          const cupo = Number(new FormData(e.currentTarget).get('cupo'))
          llamar(api(`/api/vacantes/${proyecto.id}/cupo`, { method: 'PATCH', body: { cupo } }), 'Cupo actualizado.')
        }}
      >
        <Campo etiqueta={`Cupo (aceptados: ${proyecto.aceptados})`} name="cupo" type="number" min={Math.max(1, proyecto.aceptados)} defaultValue={proyecto.cupo} required />
        <button type="submit" className="boton boton--secundario">Guardar cupo</button>
      </form>

      {proyecto.equipo.length > 0 && (
        <section aria-labelledby="equipo-proyecto">
          <h3 id="equipo-proyecto">Equipo</h3>
          <Equipo vacanteId={proyecto.id} integrantes={proyecto.equipo} cupo={proyecto.cupo} />
        </section>
      )}

      <section aria-labelledby="docentes-asignados">
        <h3 id="docentes-asignados">Docentes asignados</h3>
        {proyecto.docentes.length === 0 ? (
          <p className="nota">{completo ? 'Aún no hay asesor ni revisor.' : 'Los docentes se asignan cuando el proyecto tenga a todos sus alumnos.'}</p>
        ) : (
          <ul className="lista-simple">
            {proyecto.docentes.map((d) => (
              <li key={d.docente_id}>
                <span><strong>{d.nombre}</strong> <span className={`funcion funcion--${d.funcion}`}>{FUNCION_DOCENTE[d.funcion]}</span></span>
                <button
                  type="button"
                  className="boton boton--tenue boton--peligro"
                  onClick={() => llamar(api(`/api/vacantes/${proyecto.id}/docentes/${d.docente_id}`, { method: 'DELETE' }), `${d.nombre} ya no está en el proyecto.`)}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!completo ? (
        <p className="limite" role="status">
          Faltan {proyecto.cupo - proyecto.aceptados} de {proyecto.cupo} {proyecto.cupo === 1 ? 'alumno' : 'alumnos'} por aceptar.
          Podrás asignar al asesor y al revisor cuando el equipo esté completo.
        </p>
      ) : funcionesLibres.length === 0 ? (
        <p className="nota">El proyecto ya tiene asesor y revisor. Para cambiar a alguno, quítalo primero.</p>
      ) : (<>
      <form
        className="fila-formulario"
        onSubmit={(e) => {
          e.preventDefault()
          const f = new FormData(e.currentTarget)
          llamar(
            api(`/api/vacantes/${proyecto.id}/docentes`, {
              method: 'POST',
              body: { docente_id: Number(f.get('docente_id')), funcion: f.get('funcion') },
            }),
            'Docente asignado.',
          )
        }}
      >
        <Campo etiqueta="Docente">
          {(id) => (
            <select id={id} name="docente_id" required defaultValue="">
              <option value="" disabled>Elige un docente</option>
              {disponibles.map((d) => (
                <option key={d.docente_id} value={d.docente_id}>
                  {d.nombre}{d.estado_cuenta === 'pendiente' ? ' (sin activar)' : ''}
                </option>
              ))}
            </select>
          )}
        </Campo>
        <Campo etiqueta="Función">
          {(id) => (
            <select id={id} name="funcion" key={funcionesLibres.join()} defaultValue={funcionesLibres[0]}>
              {funcionesLibres.map((f) => <option key={f} value={f}>{FUNCION_DOCENTE[f]}</option>)}
            </select>
          )}
        </Campo>
        <button type="submit" className="boton boton--primario" disabled={disponibles.length === 0}>Asignar</button>
      </form>
      {disponibles.length === 0 && <p className="nota">No hay más docentes disponibles. Dalos de alta en Usuarios.</p>}
      </>)}
      {error && <p className="error-formulario" role="alert">{error}</p>}
    </div>
  )
}

export default function Proyectos() {
  const estado = useDatos(['/api/vacantes/coordinacion', '/api/usuarios?rol=docente'])
  const [filtro, setFiltro] = useState('pendiente')
  const [revisando, setRevisando] = useState(null)
  const [gestionId, setGestionId] = useState(null)

  return (
    <>
      <Encabezado titulo="Proyectos de empresas">
        Aprueba los proyectos que proponen las empresas y define cuántos alumnos reciben. Cuando un proyecto completa su equipo, asígnale asesor y revisor.
      </Encabezado>
      <Bloque estado={estado}>
        {([proyectos, docentes]) => {
          const enFiltro = (p, f) => (f === 'docentes' ? faltanDocentes(p) : p.estado === f)
          const lista = proyectos.filter((p) => enFiltro(p, filtro))
          const enGestion = proyectos.find((p) => p.id === gestionId)
          return (
            <>
              <div className="pestanas" role="group" aria-label="Filtrar proyectos">
                {FILTROS.map(([valor, texto]) => (
                  <button key={valor} type="button" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}>
                    {texto} ({proyectos.filter((p) => enFiltro(p, valor)).length})
                  </button>
                ))}
              </div>
              {lista.length === 0 ? (
                <Vacio
                  titulo={filtro === 'pendiente' ? 'No hay proyectos por revisar.'
                    : filtro === 'docentes' ? 'No hay equipos completos esperando docentes.'
                    : 'No hay proyectos en esta categoría.'}
                >
                  {filtro === 'docentes' && <p>Un proyecto aparece aquí cuando coordinación acepta a todos los alumnos de su cupo.</p>}
                </Vacio>
              ) : (
                <ul className="hoja lista-filas">
                  {lista.map((p) => (
                    <li key={p.id} className="fila fila--alta">
                      <span className="fila-cuerpo">
                        <strong>{p.titulo}</strong>
                        <small>{p.empresa}, {p.estado_republica ?? 'estado sin registrar'}</small>
                        <small>{p.carrera || 'Cualquier carrera'}</small>
                        {p.estado === 'rechazada' && p.motivo_rechazo && <small>Motivo: {p.motivo_rechazo}</small>}
                      </span>
                      {['activa', 'cerrada'].includes(p.estado) && (
                        <span className="fila-cuerpo">
                          <span>{p.aceptados} de {p.cupo} {p.cupo === 1 ? 'lugar ocupado' : 'lugares ocupados'}</span>
                          <small>{p.postulaciones_pendientes} {p.postulaciones_pendientes === 1 ? 'postulación por decidir' : 'postulaciones por decidir'}</small>
                          {p.equipo.length > 0 && <Equipo vacanteId={p.id} integrantes={p.equipo} cupo={p.cupo} compacto />}
                          {faltanDocentes(p) && <small className="aviso-texto">Equipo completo: falta asignar docentes</small>}
                          {p.docentes.length > 0 && <Docentes lista={p.docentes} />}
                        </span>
                      )}
                      {p.estado === 'pendiente' ? (
                        <button type="button" className="boton boton--primario" onClick={() => setRevisando(p)}>Revisar</button>
                      ) : ['activa', 'cerrada'].includes(p.estado) ? (
                        <span className="fila-acciones">
                          <Estado valor={p.estado} />
                          {faltanDocentes(p) ? (
                            <button type="button" className="boton boton--primario" onClick={() => setGestionId(p.id)}>Asignar docentes</button>
                          ) : (
                            <button type="button" className="boton boton--secundario" onClick={() => setGestionId(p.id)}>Cupo y docentes</button>
                          )}
                        </span>
                      ) : (
                        <Estado valor={p.estado} />
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <Dialogo abierto={Boolean(revisando)} onCerrar={() => setRevisando(null)} titulo="Revisar proyecto">
                {revisando && <Revision proyecto={revisando} onListo={() => { setRevisando(null); estado.recargar() }} />}
              </Dialogo>
              <Dialogo abierto={Boolean(enGestion)} onCerrar={() => setGestionId(null)} titulo={enGestion?.titulo ?? ''} ancho>
                {enGestion && <Gestion proyecto={enGestion} docentes={docentes} onCambio={estado.recargar} />}
              </Dialogo>
            </>
          )
        }}
      </Bloque>
    </>
  )
}
